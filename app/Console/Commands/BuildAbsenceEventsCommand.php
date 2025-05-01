<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Rota\Event;
use Schema;
use DB;
use Log;

class BuildAbsenceEventsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'command:BuildAbsenceEventsCommand';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Build Absence Events Command';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $startDate = date('Y-m-d', strtotime('yesterday'));
        $endDate = date('Y-m-d', strtotime("yesterday"));

        $events = $this->generateAbsenceEvents($startDate, $endDate);

        $this->loadToTable($events);

        return 1;
    }

    public function generateAbsenceEvents($startDate, $endDate){
        $absence = DB::table('halo_rota.shifts2 as shifts')
        ->select(
            'shifts.unq_id as shift_id',
            'shifts.hr_id',
            'hr_details.user_id',
            'shifts.shiftdate as date',
            DB::raw('
                STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i") AS shiftstart,
                STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftend, 4, "0")), "%Y-%m-%d %H%i") AS shiftend,
                COUNT(timesheet.on_time) AS qty
            ')
        )
        ->leftJoinSub(
            DB::table('apex_data.timesheet_master')
                ->select(
                    'timesheet_master.hr_id',
                    'timesheet_master.on_time',
                    'timesheet_master.off_time',
                    'date AS shiftdate'
                )
                ->whereRaw('on_time IS NOT NULL')
                ->whereBetween('timesheet_master.date', [$startDate, $endDate])
                ->groupBy('timesheet_master.hr_id', 'timesheet_master.date', 'timesheet_master.on_time', 'timesheet_master.off_time'),
            'timesheet',
            function ($join) {
                $join->on('shifts.hr_id', '=', 'timesheet.hr_id')
                        ->on('shifts.shiftdate', '=', 'timesheet.shiftdate')
                        ->where(function ($query) {
                        $query->where(function ($subQuery) {
                            // Condition for timesheet blocks within one hour before or after shiftstart/shiftend
                            $subQuery->whereBetween(DB::raw('TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i"), timesheet.on_time)'), [-60, 0])
                            ->orWhereBetween(DB::raw('TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i"), timesheet.on_time)'), [0, 60]);
                        })
                        ->orWhere(function ($subQuery) {
                            // Condition for timesheet blocks fully within the shiftstart and shiftend range
                            $subQuery->whereRaw('timesheet.on_time BETWEEN STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i") AND STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftend, 4, "0")), "%Y-%m-%d %H%i")')
                            ->orWhereRaw('timesheet.off_time BETWEEN STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i") AND STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftend, 4, "0")), "%Y-%m-%d %H%i")');
                        });
                    });
            }
        )
        ->leftJoin('wings_data.hr_details', 'hr_details.hr_id', 'shifts.hr_id')
        ->groupBy('shifts.unq_id')
        ->whereBetween('shifts.shiftdate', [$startDate, $endDate])
        ->get();

        $absence = $absence->where('qty', 0)->map(function ($item) {
            return [
                'hr_id' => $item->hr_id,
                'user_id' => $item->user_id,
                'created_by_user_id' => 1954,
                'requires_action' => false,
                // 'shift_id' => $item->shift_id, Redundent
                'date' => $item->date,
                'on_time' => $item->shiftstart,
                'off_time' => $item->shiftend,
                'category' => "AWOL",
                'notes' => null,
            ];
        });

        return $absence;
    }

    public function loadToTable($data)
    {
        foreach ($data as $eventData) {
            // Check if an event already exists for this shift_id
            $exists = Event::where('hr_id', $eventData['hr_id'])
            ->whereNotIn('category', ['Note', 'SMS Sent'])
            ->where(function($query) use ($eventData) {
                $query->where('on_time', '<=', $eventData['off_time'])
                    ->where('off_time', '>=', $eventData['on_time']);
            })
            ->exists();
    
            if (!$exists) {
                // Create the event using the Event model
                Event::create($eventData);
            }
        }
    }
}
