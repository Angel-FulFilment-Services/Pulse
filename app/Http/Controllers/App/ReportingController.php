<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;
use Str;
use Log;

class ReportingController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth']);
        // $this->middleware(['perm.check:view_dashboard']);
    }

    public function index(){
        return Inertia::render('Reporting/Reporting');
    }

    public function attendenceReport(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');


        // $lateness = DB::table(function ($query) use ($startDate, $endDate) {
        //     $query->select('hr_id', 'date', DB::raw('MIN(on_time) AS earliest_on_time'))
        //         ->from('apex_data.timesheet_master')
        //         ->whereBetween('date', [$startDate, $endDate])
        //         ->groupBy('hr_id', 'date')
        //     ->unionAll(
        //         DB::table('apex_data.timesheet_today')
        //             ->select('hr_id', 'date', DB::raw('MIN(on_time) AS earliest_on_time'))
        //             ->whereBetween('date', [$startDate, $endDate])
        //             ->groupBy('hr_id', 'date')
        //     );
        // }, 'earliest_timesheet');

        // Fetch shifts for the date range
        $data = DB::connection('halo_rota')
        ->table('shifts2 as shifts')
        ->leftJoinSub(
            DB::table('apex_data.timesheet_master')
                ->select('hr_id', 'date', DB::raw('SUM(TIMESTAMPDIFF(MINUTE, on_time, off_time)) AS worked_minutes_master'))
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('hr_id', 'date'),
            'timesheet_master',
            function ($join) {
                $join->on('shifts.hr_id', '=', 'timesheet_master.hr_id')
                    ->on('shifts.shiftdate', '=', 'timesheet_master.date');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.timesheet_today')
                ->select('hr_id', 'date', DB::raw('SUM(TIMESTAMPDIFF(MINUTE, on_time, off_time)) AS worked_minutes_today'))
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('hr_id', 'date'),
            'timesheet_today',
            function ($join) {
                $join->on('shifts.hr_id', '=', 'timesheet_today.hr_id')
                    ->on('shifts.shiftdate', '=', 'timesheet_today.date');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.events')
                ->select('hr_id', 'date', 
                    DB::raw('SUM(IF(category = "Reduced", TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS reduced_minutes'),
                    DB::raw('SUM(IF(category = "Sick", 1, 0)) AS sick_count'),
                    DB::raw('SUM(IF(category = "AWOL", 1, 0)) AS awol_count'),
                    DB::raw('SUM(IF(category = "Absent", 1, 0)) AS absent_count')
                )
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('hr_id', 'date'),
            'events',
            function ($join) {
                $join->on('shifts.hr_id', '=', 'events.hr_id')
                    ->on('shifts.shiftdate', '=', 'events.date');
            }
        )
        // ->leftJoinSub(
        //     Str::replaceArray('?', $lateness->getBindings(), $lateness->toSql()),
        //     'earliest_timesheet',
        //     function ($join) {
        //         $join->on('shifts.hr_id', '=', 'earliest_timesheet.hr_id')
        //             ->on('shifts.shiftdate', '=', 'earliest_timesheet.date');
        //     }
        // )
        ->whereBetween('shifts.shiftdate', [$startDate, $endDate])
        ->select(DB::raw("
            shifts.agent,
            COUNT(shifts.shiftdate) AS shifts_scheduled,
            (
                SUM(TIMESTAMPDIFF(
                    MINUTE,
                    STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
                    STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftend, 4, '0')), '%Y-%m-%d %H%i')
                )) -
                IFNULL(SUM(events.reduced_minutes), 0)
            ) / 60 AS shift_duration_hours,
            (
                IFNULL(SUM(timesheet_master.worked_minutes_master), 0) +
                IFNULL(SUM(timesheet_today.worked_minutes_today), 0)
            ) / 60 AS worked_duration_hours,
            (
                (
                    IFNULL(SUM(timesheet_master.worked_minutes_master), 0) +
                    IFNULL(SUM(timesheet_today.worked_minutes_today), 0)
                ) /
                (
                    SUM(TIMESTAMPDIFF(
                        MINUTE,
                        STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
                        STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftend, 4, '0')), '%Y-%m-%d %H%i')
                    )) -
                    IFNULL(SUM(events.reduced_minutes), 0)
                )
            ) * 100 AS worked_percentage,
            IFNULL(SUM(events.sick_count), 0) AS shifts_sick,
            IFNULL(SUM(events.sick_count), 0) / COUNT(shifts.shiftdate) * 100 AS sick_percentage,
            IFNULL(SUM(events.awol_count), 0) AS shifts_awol,
            IFNULL(SUM(events.awol_count), 0) / COUNT(shifts.shiftdate) * 100 AS awol_percentage,
            IFNULL(SUM(events.absent_count), 0) AS shifts_absent,
            IFNULL(SUM(events.absent_count), 0) / COUNT(shifts.shiftdate) * 100 AS absent_percentage
        "))
        ->groupBy('shifts.hr_id', 'shifts.agent')
        ->get();

        // SUM(
        //     IF(
        //         earliest_timesheet.earliest_on_time > STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
        //         1,
        //         0
        //         )
        //     ) AS shifts_late,
        // (
        //     SUM(
        //         IF(
        //             earliest_timesheet.earliest_on_time > STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
        //             1,
        //             0
        //         )
        //     ) / COUNT(shifts.shiftdate)
        // ) * 100 AS late_percentage

        $targets = DB::connection('wings_config')->table('reports')->where('client','ANGL')->where('campaign', 'Attendence Report')->value('targets');
                
        return response()->json(['data' => $data, 'targets' => json_decode($targets, true)]);
    }

    public function setTargets(Request $request){       
        
        $report = $request->report;
        if (is_null($report) || !is_array($report)) {
            Log::debug('1');
            return response()->json(['status' => 'error', 'message' => 'Invalid report format.'], 400);
        }

        $targets = $request->targets;
        if (!is_array($targets) || !count($targets) > 0) {
            return response()->json(['status' => 'error', 'message' => 'Invalid targets format.'], 400);
        }

        try {
            DB::connection('wings_config')
                ->table('reports')
                ->where('client','ANGL')
                ->where('campaign', $report['label'])
                ->update(['targets' => json_encode($targets)]);
            return response()->json(['status' => 'success', 'message' => 'Targets updated successfully.']);
        } catch(\Throwable $e){
            Log::error('Error updating targets: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Failed to update targets.'], 500);
        }

        return response()->json(['status' => 'error', 'message' => 'No targets provided.'], 400);
    }

    public function utilisationTargets(Request $request){
        $targets = json_decode(DB::connection('wings_config')
        ->table('dashboard_tiles')
        ->where('id', 41)
        ->value('configuration'), true);

        $targets = (is_array($targets) && array_key_exists('utilisation_targets', $targets) ? $targets['utilisation_targets'] : null);

        return response()->json($targets);
    }
}
