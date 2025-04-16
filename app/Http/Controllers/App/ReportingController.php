<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;
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
        //         (
        //             SELECT MIN(timesheet.on_time)
        //             FROM (
        //                 SELECT * FROM apex_data.timesheet_master
        //                 UNION ALL
        //                 SELECT * FROM apex_data.timesheet_today
        //             ) AS timesheet
        //             WHERE timesheet.hr_id = shifts.hr_id
        //             AND timesheet.date = shifts.shiftdate
        //             AND timesheet.on_time >= DATE_SUB(STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'), INTERVAL 1 HOUR)
        //             AND timesheet.on_time <= STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftend, 4, '0')), '%Y-%m-%d %H%i')
        //             AND timesheet.off_time >= STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i')
        //             AND timesheet.off_time <= DATE_ADD(STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftend, 4, '0')), '%Y-%m-%d %H%i'), INTERVAL 1 HOUR)
        //         ) > STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
        //         1,
        //         0
        //     )
        // ) AS shifts_late


        $targets = [];

        return response()->json($data);
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
