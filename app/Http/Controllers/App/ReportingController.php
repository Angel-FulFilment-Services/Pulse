<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;
use Str;
use Log;
use App\Helper\Auditing;

class ReportingController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth']);
        $this->middleware(['has.permission:pulse_view_reporting']);
    }

    public function index(Request $request){
        return Inertia::render('Reporting/Reporting');
    }

    public function attendenceReport(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Fetch shifts for the date range
        $data = DB::connection('wings_data')
        ->table('hr_details as hr')
        ->leftJoin('wings_config.users', 'users.id', 'hr.user_id')
        ->leftJoinSub(
            DB::table('halo_rota.shifts2 as shifts')
                ->select(
                    'shifts.hr_id',
                    DB::raw('
                        SUM(TIMESTAMPDIFF(
                            MINUTE,
                            STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i"),
                            STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftend, 4, "0")), "%Y-%m-%d %H%i")
                        )) as shift_duration_hours,
                        COUNT(shifts.shiftdate) AS shifts_scheduled,
                        SUM(
                            CASE
                                WHEN earliest_timesheet.on_time > STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i")
                                THEN 1
                                ELSE 0
                            END
                        ) AS late_count
                    ')
                )
                ->leftJoinSub(
                    DB::table('apex_data.timesheet_master')
                        ->select(
                            'timesheet_master.hr_id',
                            'date AS shiftdate',
                            DB::raw('MIN(on_time) AS on_time')
                        )
                        ->whereRaw('on_time IS NOT NULL')
                        ->whereBetween('timesheet_master.date', [$startDate, $endDate])
                        ->groupBy('timesheet_master.hr_id', 'timesheet_master.date'),
                    'earliest_timesheet',
                    function ($join) {
                        $join->on('shifts.hr_id', '=', 'earliest_timesheet.hr_id')
                             ->on('shifts.shiftdate', '=', 'earliest_timesheet.shiftdate')
                             ->where(function ($query) {
                                $query->where(function ($subQuery) {
                                    // Condition for timesheet blocks within one hour before or after shiftstart/shiftend
                                    $subQuery->whereBetween(DB::raw('TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i"), on_time)'), [-60, 0]);
                                })
                                ->orWhere(function ($subQuery) {
                                    // Condition for timesheet blocks fully within the shiftstart and shiftend range
                                    $subQuery->whereRaw('on_time BETWEEN STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i") AND STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftend, 4, "0")), "%Y-%m-%d %H%i")');
                                });
                            });
                    }
                )
                ->whereBetween('shifts.shiftdate', [$startDate, $endDate])
                ->groupBy('hr_id'),
            'shifts',
            function ($join) {
                $join->on('hr.hr_id', '=', 'shifts.hr_id');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.timesheet_master')
                ->select(
                    'timesheet_master.hr_id',
                    DB::raw('SUM(TIMESTAMPDIFF(MINUTE, on_time, off_time)) AS worked_minutes_master'),
                    DB::raw('
                        SUM(
                            CASE
                                WHEN shifts.hr_id IS NULL THEN TIMESTAMPDIFF(MINUTE, on_time, off_time)
                                ELSE 0
                            END
                        ) AS surplus_minutes_master
                    ')
                )
                ->leftJoinSub(
                    DB::table('halo_rota.shifts2 as shifts')
                        ->select('hr_id', 'shiftdate', 'shiftstart', 'shiftend')
                        ->whereBetween('shiftdate', [$startDate, $endDate])
                        ->groupBy('hr_id', 'shiftdate', 'shiftstart', 'shiftend'),
                    'shifts',
                    function ($join) {
                        $join->on('apex_data.timesheet_master.hr_id', '=', 'shifts.hr_id')
                        ->where(function ($query) {
                            $query->where(function ($subQuery) {
                                // Condition for timesheet blocks within one hour before or after shiftstart/shiftend
                                $subQuery->whereBetween(DB::raw('TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i"), on_time)'), [-60, 0])
                                         ->orWhereBetween(DB::raw('TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftend, 4, "0")), "%Y-%m-%d %H%i"), off_time)'), [0, 60]);
                            })
                            ->orWhere(function ($subQuery) {
                                // Condition for timesheet blocks fully within the shiftstart and shiftend range
                                $subQuery->whereRaw('on_time BETWEEN STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i") AND STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftend, 4, "0")), "%Y-%m-%d %H%i")')
                                         ->orWhereRaw('off_time BETWEEN STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i") AND STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftend, 4, "0")), "%Y-%m-%d %H%i")');
                            });
                        });
                    }
                )
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('hr_id'),
            'timesheet_master',
            function ($join) {
                $join->on('hr.hr_id', '=', 'timesheet_master.hr_id');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.timesheet_today')
                ->select(
                    'timesheet_today.hr_id',
                    DB::raw('SUM(TIMESTAMPDIFF(MINUTE, on_time, off_time)) AS worked_minutes_today'),
                    DB::raw('
                        SUM(
                            CASE
                                WHEN shifts.hr_id IS NULL THEN TIMESTAMPDIFF(MINUTE, on_time, off_time)
                                ELSE 0
                            END
                        ) AS surplus_minutes_today
                    ')
                )
                ->leftJoinSub(
                    DB::table('halo_rota.shifts2 as shifts')
                        ->select('hr_id', 'shiftdate')
                        ->whereBetween('shiftdate', [$startDate, $endDate])
                        ->groupBy('hr_id', 'shiftdate'),
                    'shifts',
                    function ($join) {
                        $join->on('apex_data.timesheet_today.hr_id', '=', 'shifts.hr_id')
                             ->on('apex_data.timesheet_today.date', '=', 'shifts.shiftdate');
                    }
                )
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('hr_id'),
            'timesheet_today',
            function ($join) {
                $join->on('hr.hr_id', '=', 'timesheet_today.hr_id');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.events')
                ->select('hr_id', 
                    DB::raw('SUM(IF(category = "Reduced", TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS reduced_minutes'),
                    DB::raw('SUM(IF(category = "Sick", 1, 0)) AS sick_count'),
                    DB::raw('SUM(IF(category = "AWOL", 1, 0)) AS awol_count'),
                    DB::raw('SUM(IF(category = "Absent", 1, 0)) AS absent_count')
                )
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('hr_id'),
            'events',
            function ($join) {
                $join->on('hr.hr_id', '=', 'events.hr_id');
            }
        )        
        ->leftJoinSub(
            DB::table('apex_data.breaksheet_master')
                ->select(
                    'breaksheet_master.hr_id',
                    DB::raw('SUM(TIMESTAMPDIFF(MINUTE, on_time, off_time)) AS break_minutes'),
                )
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('hr_id'),
            'breaksheet',
            function ($join) {
                $join->on('hr.hr_id', '=', 'breaksheet.hr_id');
            }
        )
        ->select(DB::raw("
            users.name AS agent,
            IFNULL(SUM(shifts.shifts_scheduled), 0) AS shifts_scheduled,
            (
                IFNULL(SUM(shifts.shift_duration_hours), 0) +
                (IFNULL(SUM(timesheet_master.surplus_minutes_master), 0) + IFNULL(SUM(timesheet_today.surplus_minutes_today), 0)) -
                IFNULL(SUM(events.reduced_minutes), 0)
            ) / 60 AS shift_duration_hours,
            (
                IFNULL(SUM(timesheet_master.worked_minutes_master), 0) +
                IFNULL(SUM(timesheet_today.worked_minutes_today), 0) +
                IFNULL(SUM(breaksheet.break_minutes), 0)
            ) / 60 AS worked_duration_hours,
            IFNULL(
                (
                    (
                        IFNULL(SUM(timesheet_master.worked_minutes_master), 0) +
                        IFNULL(SUM(timesheet_today.worked_minutes_today), 0) +
                        IFNULL(SUM(breaksheet.break_minutes), 0)
                    ) /
                    (
                        IFNULL(SUM(shifts.shift_duration_hours), 0) +
                        (IFNULL(SUM(timesheet_master.surplus_minutes_master), 0) + IFNULL(SUM(timesheet_today.surplus_minutes_today), 0)) -
                        IFNULL(SUM(events.reduced_minutes), 0)
                    )
                ) * 100, 0
            ) AS worked_percentage,
            IFNULL(SUM(shifts.late_count), 0) AS shifts_late,
            IFNULL((SUM(shifts.late_count) / SUM(shifts.shifts_scheduled)) * 100, 0) AS late_percentage,
            IFNULL(SUM(events.sick_count), 0) AS shifts_sick,
            IFNULL((SUM(events.sick_count) / SUM(shifts.shifts_scheduled)) * 100, 0) AS sick_percentage,
            IFNULL(SUM(events.awol_count), 0) AS shifts_awol,
            IFNULL((SUM(events.awol_count) / SUM(shifts.shifts_scheduled)) * 100, 0) AS awol_percentage,
            IFNULL(SUM(events.absent_count), 0) AS shifts_absent,
            IFNULL((SUM(events.absent_count) / SUM(shifts.shifts_scheduled)) * 100, 0) AS absent_percentage
        "))
        ->where('shifts.shifts_scheduled', '>', 0)
        ->orWhere(function ($query) {
            $query->where('timesheet_master.worked_minutes_master', '>', 0)
            ->orWhere('timesheet_today.worked_minutes_today', '>', 0);
        })
        ->groupBy('hr.hr_id')
        ->orderBy('agent')
        ->get();

        $targets = DB::connection('wings_config')->table('reports')->where('client','ANGL')->where('campaign', 'Attendence Report')->value('targets');
                
        return response()->json(['data' => $data, 'targets' => json_decode($targets, true)]);
    }

    public function hoursComparisonReport(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Fetch shifts for the date range
        $data = DB::connection('halo_rota')
        ->table('shifts2 as shifts')
        ->leftJoin('wings_data.hr_details', 'shifts.hr_id', '=', 'hr_details.hr_id')
        ->leftJoinSub(
            DB::table('apex_data.timesheet_master')
                ->select('timesheet_master.hr_id', 'date', DB::raw('
                    SUM(IF(hr_details.rank IS NULL OR hr_details.rank = "", TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS agent_worked_minutes_master,
                    SUM(IF(hr_details.rank IS NOT NULL OR hr_details.rank != "", TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS management_worked_minutes_master
                '))
                ->leftJoin('wings_data.hr_details', 'timesheet_master.hr_id', '=', 'hr_details.hr_id')
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('timesheet_master.hr_id', 'date'),
            'timesheet_master',
            function ($join) {
                $join->on('shifts.hr_id', '=', 'timesheet_master.hr_id')
                    ->on('shifts.shiftdate', '=', 'timesheet_master.date');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.timesheet_today')
                ->select('timesheet_today.hr_id', 'date', DB::raw('
                    SUM(IF(hr_details.rank IS NULL OR hr_details.rank = "", TIMESTAMPDIFF(MINUTE, on_time, IFNULL(off_time, NOW())), 0)) AS agent_worked_minutes_today,
                    SUM(IF(hr_details.rank IS NOT NULL OR hr_details.rank != "", TIMESTAMPDIFF(MINUTE, on_time, IFNULL(off_time, NOW())), 0)) AS management_worked_minutes_today
                '))
                ->leftJoin('wings_data.hr_details', 'timesheet_today.hr_id', '=', 'hr_details.hr_id')
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('timesheet_today.hr_id', 'date'),
            'timesheet_today',
            function ($join) {
                $join->on('shifts.hr_id', '=', 'timesheet_today.hr_id')
                    ->on('shifts.shiftdate', '=', 'timesheet_today.date');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.apex_data')
                ->select('apex_data.hr_id', 'date', DB::raw('
                    SUM(IF(apex_data.type <> "Queue", apex_data.ring_time + apex_data.calltime, apex_data.calltime)) as time
                '))
                ->leftJoin('wings_data.hr_details', 'apex_data.hr_id', '=', 'hr_details.hr_id')
                ->whereBetween('date', [$startDate, $endDate])
                ->where(function($query){
                    $query->where('apex_data.answered','=','1');
                    $query->orWhere('apex_data.type','<>','Queue');
                })
                ->groupBy('apex_data.hr_id', 'date'),
            'apex_data',
            function ($join) {
                $join->on('shifts.hr_id', '=', 'apex_data.hr_id')
                    ->on('shifts.shiftdate', '=', 'apex_data.date');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.events')
                ->select('events.hr_id', 'date', 
                    DB::raw('SUM(IF(category = "Reduced" AND (hr_details.rank IS NULL OR hr_details.rank = ""), TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS agent_reduced_minutes'),
                    DB::raw('SUM(IF(category = "Sick" AND (hr_details.rank IS NULL OR hr_details.rank = ""), TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS agent_sick_minutes'),
                    DB::raw('SUM(IF(category = "AWOL" AND (hr_details.rank IS NULL OR hr_details.rank = ""), TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS agent_awol_minutes'),
                    DB::raw('SUM(IF(category = "Absent" AND (hr_details.rank IS NULL OR hr_details.rank = ""), TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS agent_absent_minutes'),
                )
                ->leftJoin('wings_data.hr_details', 'events.hr_id', '=', 'hr_details.hr_id')
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('events.hr_id', 'date'),
            'events',
            function ($join) {
                $join->on('shifts.hr_id', '=', 'events.hr_id')
                    ->on('shifts.shiftdate', '=', 'events.date');
            }
        )        
        ->leftJoinSub(
            DB::table('apex_data.breaksheet_master')
                ->select(
                    'breaksheet_master.hr_id',
                    'date', 
                    DB::raw('
                        SUM(IF(hr_details.rank IS NULL OR hr_details.rank = "", TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS agent_break_minutes,
                        SUM(IF(hr_details.rank IS NOT NULL OR hr_details.rank != "", TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS management_break_minutes
                    ')
                )
                ->leftJoin('wings_data.hr_details', 'breaksheet_master.hr_id', '=', 'hr_details.hr_id')
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('hr_id', 'date'),
            'breaksheet',
            function ($join) {
                $join->on('shifts.hr_id', '=', 'breaksheet.hr_id')
                    ->on('shifts.shiftdate', '=', 'breaksheet.date');
            }
        )
        ->whereBetween('shifts.shiftdate', [$startDate, $endDate])
        ->select(DB::raw("
            shifts.shiftdate as shift_date,
            (
                SUM(IF(hr_details.rank IS NULL OR hr_details.rank = '', TIMESTAMPDIFF(
                    MINUTE,
                    STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
                    STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftend, 4, '0')), '%Y-%m-%d %H%i')
                ), 0))
            ) / 60 AS agent_shift_duration_hours,
            (
                SUM(IF(hr_details.rank IS NOT NULL OR hr_details.rank != '', TIMESTAMPDIFF(
                    MINUTE,
                    STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
                    STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftend, 4, '0')), '%Y-%m-%d %H%i')
                ), 0))
            ) / 60 AS management_shift_duration_hours,
            (
                IFNULL(SUM(timesheet_master.agent_worked_minutes_master), 0) +
                IFNULL(SUM(timesheet_today.agent_worked_minutes_today), 0) +
                IFNULL(SUM(breaksheet.agent_break_minutes), 0)
            ) / 60 AS agent_worked_duration_hours,
            (
                IFNULL(SUM(timesheet_master.agent_worked_minutes_master), 0) +
                IFNULL(SUM(timesheet_today.agent_worked_minutes_today), 0)
            ) / 60 AS agent_worked_duration_hours_excl_breaks,
            (
                IFNULL(SUM(timesheet_master.management_worked_minutes_master), 0) +
                IFNULL(SUM(timesheet_today.management_worked_minutes_today), 0)
            ) / 60 AS management_worked_duration_hours_excl_breaks,
            (
                IFNULL(SUM(timesheet_master.agent_worked_minutes_master), 0) +
                IFNULL(SUM(timesheet_today.agent_worked_minutes_today), 0) +
                IFNULL(SUM(breaksheet.agent_break_minutes), 0)
            ) AS agent_worked_duration_seconds,
            (
                IFNULL(SUM(timesheet_master.management_worked_minutes_master), 0) +
                IFNULL(SUM(timesheet_today.management_worked_minutes_today), 0) +
                IFNULL(SUM(breaksheet.management_break_minutes), 0)
            ) / 60 AS management_worked_duration_hours,
            (
                (
                    IFNULL(SUM(timesheet_master.agent_worked_minutes_master), 0) +
                    IFNULL(SUM(timesheet_today.agent_worked_minutes_today), 0) +
                    IFNULL(SUM(breaksheet.agent_break_minutes), 0)
                ) / 60 
            ) -
            (
                (
                    SUM(IF(hr_details.rank IS NULL OR hr_details.rank = '', TIMESTAMPDIFF(
                        MINUTE,
                        STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
                        STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftend, 4, '0')), '%Y-%m-%d %H%i')
                    ), 0))
                ) / 60
            ) as agent_difference,
            (
                (
                    IFNULL(SUM(timesheet_master.management_worked_minutes_master), 0) +
                    IFNULL(SUM(timesheet_today.management_worked_minutes_today), 0) +
                    IFNULL(SUM(breaksheet.management_break_minutes), 0)
                ) / 60 
            ) -
            (
                (
                    SUM(IF(hr_details.rank IS NOT NULL OR hr_details.rank != '', TIMESTAMPDIFF(
                        MINUTE,
                        STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
                        STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftend, 4, '0')), '%Y-%m-%d %H%i')
                    ), 0))
                ) / 60
            ) as management_difference,
            (
                (
                    IFNULL(SUM(timesheet_master.agent_worked_minutes_master), 0) +
                    IFNULL(SUM(timesheet_today.agent_worked_minutes_today), 0) +
                    IFNULL(SUM(breaksheet.agent_break_minutes), 0)
                ) / 60 
            ) /
            (
                (
                    SUM(IF(hr_details.rank IS NULL OR hr_details.rank = '', TIMESTAMPDIFF(
                        MINUTE,
                        STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
                        STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftend, 4, '0')), '%Y-%m-%d %H%i')
                    ), 0))
                ) / 60
            ) * 100 as agent_worked_percentage,
            (
                (
                    IFNULL(SUM(timesheet_master.management_worked_minutes_master), 0) +
                    IFNULL(SUM(timesheet_today.management_worked_minutes_today), 0) +
                    IFNULL(SUM(breaksheet.management_break_minutes), 0)
                ) / 60 
            ) /
            (
                (
                    SUM(IF(hr_details.rank IS NOT NULL OR hr_details.rank != '', TIMESTAMPDIFF(
                        MINUTE,
                        STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftstart, 4, '0')), '%Y-%m-%d %H%i'),
                        STR_TO_DATE(CONCAT(shifts.shiftdate, ' ', LPAD(shifts.shiftend, 4, '0')), '%Y-%m-%d %H%i')
                    ), 0))
                ) / 60
            ) * 100 as management_worked_percentage,
            (
                IFNULL(SUM(events.agent_sick_minutes), 0)
            ) / 60 as agent_sick_hours,
            (
                IFNULL(SUM(events.agent_awol_minutes), 0) +
                IFNULL(SUM(events.agent_absent_minutes), 0)
            ) / 60 as agent_awol_hours,
            (
                IFNULL(SUM(apex_data.time), 0)
            ) / 60 as minutes,
            IFNULL(
                (
                    (
                        (
                            IFNULL(SUM(apex_data.time), 0)
                        ) / 60
                    ) /
                    (
                        (
                            IFNULL(SUM(timesheet_master.agent_worked_minutes_master), 0) +
                            IFNULL(SUM(timesheet_today.agent_worked_minutes_today), 0)
                        )
                    ) 
                ) * 100, 0) as utilisation
        "))
        ->groupBy('shifts.shiftdate')
        ->get();

        $targets = DB::connection('wings_config')->table('reports')->where('client','ANGL')->where('campaign', 'Hours Comparison Report')->value('targets');
                
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

            // Log the action
            Auditing::log('Reporting', auth()->user()->id, 'Target set', json_encode($targets));

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
