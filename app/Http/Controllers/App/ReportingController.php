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
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['has.permission:pulse_view_reporting']);
        $this->middleware(['log.access']);
    }

    public function index(Request $request){
        return Inertia::render('Reporting/Reporting');
    }

    public function attendenceReport(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        set_time_limit(300);

        // Bradford Factor calculation - 12 month rolling period with minimum date of April 1st 2025
        $bradfordStartDate = max('2025-04-01', date('Y-m-d', strtotime('-12 months')));
        $bradfordEndDate = date('Y-m-d');
        
        $bradfordFactors = DB::connection('wings_data')
            ->table('apex_data.events as e1')
            ->leftJoinSub(
                DB::table('halo_rota.shifts2')
                    ->select(
                        'hr_id',
                        'shiftdate',
                        DB::raw('SUM(TIMESTAMPDIFF(MINUTE, 
                            STR_TO_DATE(CONCAT(shiftdate, " ", LPAD(shiftstart, 4, "0")), "%Y-%m-%d %H%i"),
                            STR_TO_DATE(CONCAT(shiftdate, " ", LPAD(shiftend, 4, "0")), "%Y-%m-%d %H%i")
                        )) as total_daily_shift_minutes')
                    )
                    ->whereBetween('shiftdate', [$bradfordStartDate, $bradfordEndDate])
                    ->groupBy('hr_id', 'shiftdate'),
                'daily_shifts',
                function($join) {
                    $join->on('e1.hr_id', '=', 'daily_shifts.hr_id')
                         ->on(DB::raw('DATE(e1.date)'), '=', 'daily_shifts.shiftdate');
                }
            )
            ->select(
                'e1.hr_id',
                DB::raw('
                    COUNT(CASE 
                        WHEN e1.category IN ("Sick", "AWOL", "Absent") 
                            AND (
                                daily_shifts.hr_id IS NULL OR
                                TIMESTAMPDIFF(MINUTE, e1.on_time, e1.off_time) >= 
                                (daily_shifts.total_daily_shift_minutes / 2)
                            )
                            AND NOT EXISTS (
                                SELECT 1 
                                FROM apex_data.events e2
                                INNER JOIN halo_rota.shifts2 s2 ON s2.hr_id = e1.hr_id AND DATE(e2.date) = s2.shiftdate
                                WHERE e2.hr_id = e1.hr_id 
                                AND e2.category IN ("Sick", "AWOL", "Absent")
                                AND (
                                    s2.hr_id IS NULL OR
                                    TIMESTAMPDIFF(MINUTE, e2.on_time, e2.off_time) >= 
                                    (TIMESTAMPDIFF(MINUTE, 
                                        STR_TO_DATE(CONCAT(s2.shiftdate, " ", LPAD(s2.shiftstart, 4, "0")), "%Y-%m-%d %H%i"),
                                        STR_TO_DATE(CONCAT(s2.shiftdate, " ", LPAD(s2.shiftend, 4, "0")), "%Y-%m-%d %H%i")
                                    ) / 2)
                                )
                                AND s2.shiftdate = (
                                    SELECT MAX(s3.shiftdate) 
                                    FROM halo_rota.shifts2 s3 
                                    WHERE s3.hr_id = e1.hr_id 
                                    AND s3.shiftdate < DATE(e1.date)
                                    AND s3.shiftdate BETWEEN "' . $bradfordStartDate . '" AND "' . $bradfordEndDate . '"
                                )
                            )
                        THEN 1 
                        ELSE NULL 
                    END) AS absence_spells
                '),
                // Count total absence days
                DB::raw('
                    COUNT(DISTINCT CASE 
                        WHEN e1.category IN ("Sick", "AWOL", "Absent") 
                            AND (
                                daily_shifts.hr_id IS NULL OR
                                TIMESTAMPDIFF(MINUTE, e1.on_time, e1.off_time) >= 
                                (daily_shifts.total_daily_shift_minutes / 2)
                            )
                        THEN DATE(e1.date)
                        ELSE NULL 
                    END) AS total_absence_days
                '),
                // Calculate Bradford Factor: Spells² × Days
                DB::raw('
                    CASE 
                        WHEN COUNT(CASE 
                            WHEN e1.category IN ("Sick", "AWOL", "Absent") 
                                AND (
                                    daily_shifts.hr_id IS NULL OR
                                    TIMESTAMPDIFF(MINUTE, e1.on_time, e1.off_time) >= 
                                    (daily_shifts.total_daily_shift_minutes / 2)
                                )
                                AND NOT EXISTS (
                                    SELECT 1 
                                    FROM apex_data.events e2
                                    INNER JOIN halo_rota.shifts2 s2 ON s2.hr_id = e1.hr_id AND DATE(e2.date) = s2.shiftdate
                                    WHERE e2.hr_id = e1.hr_id 
                                    AND e2.category IN ("Sick", "AWOL", "Absent")
                                    AND (
                                        s2.hr_id IS NULL OR
                                        TIMESTAMPDIFF(MINUTE, e2.on_time, e2.off_time) >= 
                                        (TIMESTAMPDIFF(MINUTE, 
                                            STR_TO_DATE(CONCAT(s2.shiftdate, " ", LPAD(s2.shiftstart, 4, "0")), "%Y-%m-%d %H%i"),
                                            STR_TO_DATE(CONCAT(s2.shiftdate, " ", LPAD(s2.shiftend, 4, "0")), "%Y-%m-%d %H%i")
                                        ) / 2)
                                    )
                                    AND s2.shiftdate = (
                                        SELECT MAX(s3.shiftdate) 
                                        FROM halo_rota.shifts2 s3 
                                        WHERE s3.hr_id = e1.hr_id 
                                        AND s3.shiftdate < DATE(e1.date)
                                        AND s3.shiftdate BETWEEN "' . $bradfordStartDate . '" AND "' . $bradfordEndDate . '"
                                    )
                                )
                            THEN 1 
                            ELSE NULL 
                        END) > 0 
                        THEN POW(COUNT(CASE 
                            WHEN e1.category IN ("Sick", "AWOL", "Absent") 
                                AND (
                                    daily_shifts.hr_id IS NULL OR
                                    TIMESTAMPDIFF(MINUTE, e1.on_time, e1.off_time) >= 
                                    (daily_shifts.total_daily_shift_minutes / 2)
                                )
                                AND NOT EXISTS (
                                    SELECT 1 
                                    FROM apex_data.events e2
                                    INNER JOIN halo_rota.shifts2 s2 ON s2.hr_id = e1.hr_id AND DATE(e2.date) = s2.shiftdate
                                    WHERE e2.hr_id = e1.hr_id 
                                    AND e2.category IN ("Sick", "AWOL", "Absent")
                                    AND (
                                        s2.hr_id IS NULL OR
                                        TIMESTAMPDIFF(MINUTE, e2.on_time, e2.off_time) >= 
                                        (TIMESTAMPDIFF(MINUTE, 
                                            STR_TO_DATE(CONCAT(s2.shiftdate, " ", LPAD(s2.shiftstart, 4, "0")), "%Y-%m-%d %H%i"),
                                            STR_TO_DATE(CONCAT(s2.shiftdate, " ", LPAD(s2.shiftend, 4, "0")), "%Y-%m-%d %H%i")
                                        ) / 2)
                                    )
                                    AND s2.shiftdate = (
                                        SELECT MAX(s3.shiftdate) 
                                        FROM halo_rota.shifts2 s3 
                                        WHERE s3.hr_id = e1.hr_id 
                                        AND s3.shiftdate < DATE(e1.date)
                                        AND s3.shiftdate BETWEEN "' . $bradfordStartDate . '" AND "' . $bradfordEndDate . '"
                                    )
                                )
                            THEN 1 
                            ELSE NULL 
                        END), 2) * COUNT(DISTINCT CASE 
                            WHEN e1.category IN ("Sick", "AWOL", "Absent") 
                                AND (
                                    daily_shifts.hr_id IS NULL OR
                                    TIMESTAMPDIFF(MINUTE, e1.on_time, e1.off_time) >= 
                                    (daily_shifts.total_daily_shift_minutes / 2)
                                )
                            THEN DATE(e1.date)
                            ELSE NULL 
                        END)
                        ELSE 0
                    END AS bradford_factor
                ')
            )
            ->whereBetween('e1.date', [$bradfordStartDate, $bradfordEndDate])
            ->groupBy('e1.hr_id')
            ->get();

        // Fetch shifts for the date range
        $data = DB::connection('wings_data')
        ->table('hr_details as hr')
        ->leftJoin('wings_config.users', 'users.id', 'hr.user_id')
        ->leftJoinSub(
            DB::table('halo_rota.shifts2 as shifts')
                ->select(
                    'shifts.hr_id',
                    'shifts.shiftcat',
                    'shifts.shiftloc',
                    DB::raw('
                        SUM(TIMESTAMPDIFF(
                            MINUTE,
                            STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i"),
                            STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftend, 4, "0")), "%Y-%m-%d %H%i")
                        )) as shift_duration_hours,
                        COUNT(shifts.shiftdate) AS shifts_scheduled,
                        SUM(
                            CASE
                                WHEN earliest_timesheet.on_time > DATE_ADD(STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i"), INTERVAL 1 MINUTE)
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
                ->groupBy('hr_id')
                ->groupBy('shiftcat', 'shiftloc'),
            'shifts',
            function ($join) {
                $join->on('hr.hr_id', '=', 'shifts.hr_id');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.timesheet_master')
                ->select(
                    'timesheet_master.hr_id',
                    'shiftcat',
                    'shiftloc',
                    DB::raw('SUM(TIMESTAMPDIFF(SECOND, on_time, off_time)) / 60 AS worked_minutes_master'),
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
                        ->select('hr_id', 'shiftdate', 'shiftstart', 'shiftend', 'shiftcat', 'shiftloc')
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
                ->groupBy('hr_id', 'shiftcat', 'shiftloc'),
            'timesheet_master',
            function ($join) {
                $join->on('hr.hr_id', '=', 'timesheet_master.hr_id');
                $join->on('shifts.shiftcat', '=', 'timesheet_master.shiftcat');
                $join->on('shifts.shiftloc', '=', 'timesheet_master.shiftloc');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.timesheet_today')
                ->select(
                    'timesheet_today.hr_id',
                    'shiftcat',
                    'shiftloc',
                    DB::raw('SUM(TIMESTAMPDIFF(SECOND, on_time, off_time)) / 60 AS worked_minutes_today'),
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
                        ->select('hr_id', 'shiftdate', 'shiftcat', 'shiftloc')
                        ->whereBetween('shiftdate', [$startDate, $endDate])
                        ->groupBy('hr_id', 'shiftdate', 'shiftcat', 'shiftloc'),
                    'shifts',
                    function ($join) {
                        $join->on('apex_data.timesheet_today.hr_id', '=', 'shifts.hr_id')
                             ->on('apex_data.timesheet_today.date', '=', 'shifts.shiftdate');
                    }
                )
                ->whereBetween('date', [$startDate, $endDate])
                ->groupBy('hr_id', 'shiftcat', 'shiftloc'),
            'timesheet_today',
            function ($join) {
                $join->on('hr.hr_id', '=', 'timesheet_today.hr_id');
                $join->on('shifts.shiftcat', '=', 'timesheet_today.shiftcat');
                $join->on('shifts.shiftloc', '=', 'timesheet_today.shiftloc');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.events')
                ->leftJoinSub(
                    DB::table('halo_rota.shifts2')
                        ->select(
                            'hr_id',
                            'shiftdate',
                            'shiftstart',
                            'shiftend',
                            'shiftcat',
                            'shiftloc',
                            DB::raw('SUM(TIMESTAMPDIFF(MINUTE, 
                                STR_TO_DATE(CONCAT(shiftdate, " ", LPAD(shiftstart, 4, "0")), "%Y-%m-%d %H%i"),
                                STR_TO_DATE(CONCAT(shiftdate, " ", LPAD(shiftend, 4, "0")), "%Y-%m-%d %H%i")
                            )) as total_daily_shift_minutes')
                        )
                        ->groupBy('hr_id', 'shiftdate'),
                    'shifts',
                    function ($join) {
                        $join->on('apex_data.events.hr_id', '=', 'shifts.hr_id')
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
                ->select('events.hr_id', 
                    'shifts.shiftcat',
                    'shifts.shiftloc',
                    DB::raw('SUM(IF(category = "Reduced", TIMESTAMPDIFF(MINUTE, on_time, off_time), 0)) AS reduced_minutes'),
                    DB::raw('SUM(IF(category = "Sick", 1, 0)) AS sick_count'),
                    DB::raw('SUM(IF(category = "AWOL", 1, 0)) AS awol_count'),
                    DB::raw('SUM(IF(category = "Absent", 1, 0)) AS absent_count'),
                    DB::raw('
                        COUNT(DISTINCT CASE 
                            WHEN category IN ("Sick", "AWOL", "Absent") 
                                AND (
                                    shifts.hr_id IS NULL OR
                                    TIMESTAMPDIFF(MINUTE, events.on_time, events.off_time) >= 
                                    (shifts.total_daily_shift_minutes / 2)
                                )
                            THEN DATE(events.date)
                            ELSE NULL 
                        END) AS total_absence_days
                    ')
                )
                ->whereBetween('events.date', [$startDate, $endDate])
                ->groupBy('events.hr_id', 'shifts.shiftcat', 'shifts.shiftloc'),
            'events',
            function ($join) {
                $join->on('hr.hr_id', '=', 'events.hr_id');
                $join->on('shifts.shiftcat', '=', 'events.shiftcat');
                $join->on('shifts.shiftloc', '=', 'events.shiftloc');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.breaksheet_master')
                ->select(
                    'breaksheet_master.hr_id',
                    'shiftcat',
                    'shiftloc',
                    DB::raw('SUM(TIMESTAMPDIFF(MINUTE, on_time, off_time)) AS break_minutes'),
                )
                ->leftJoinSub(
                    DB::table('halo_rota.shifts2 as shifts')
                        ->select('hr_id', 'shiftdate', 'shiftstart', 'shiftend', 'shiftcat', 'shiftloc')
                        ->whereBetween('shiftdate', [$startDate, $endDate])
                        ->groupBy('hr_id', 'shiftdate', 'shiftstart', 'shiftend'),
                    'shifts',
                    function ($join) {
                        $join->on('apex_data.breaksheet_master.hr_id', '=', 'shifts.hr_id')
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
                ->groupBy('hr_id', 'shiftcat', 'shiftloc'),
            'breaksheet',
            function ($join) {
                $join->on('hr.hr_id', '=', 'breaksheet.hr_id');
                $join->on('shifts.shiftcat', '=', 'breaksheet.shiftcat');
                $join->on('shifts.shiftloc', '=', 'breaksheet.shiftloc');
            }
        )
        ->leftJoinSub(
            DB::table('apex_data.apex_data')
                ->select(
                    'apex_data.hr_id', 
                    'apex_data.date_time',
                    'shifts.shiftcat',
                    'shifts.shiftloc',
                    DB::raw('
                        SUM(IF(apex_data.type <> "Queue", apex_data.ring_time + apex_data.calltime, apex_data.calltime)) as time
                    ')
                )
                ->leftJoinSub(
                    DB::table('halo_rota.shifts2 as shifts')
                        ->select('hr_id', 'shiftdate', 'shiftstart', 'shiftend', 'shiftcat', 'shiftloc')
                        ->whereBetween('shiftdate', [$startDate, $endDate])
                        ->groupBy('hr_id', 'shiftdate', 'shiftstart', 'shiftend'),
                    'shifts',
                    function ($join) {
                        $join->on('apex_data.apex_data.hr_id', '=', 'shifts.hr_id')
                        ->where(function ($query) {
                            $query->where(function ($subQuery) {
                                // Condition for timesheet blocks within one hour before or after shiftstart/shiftend
                                $subQuery->whereBetween(DB::raw('TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i"), apex_data.date_time)'), [-60, 0]);
                            })
                            ->orWhere(function ($subQuery) {
                                // Condition for timesheet blocks fully within the shiftstart and shiftend range
                                $subQuery->whereRaw('apex_data.date_time BETWEEN STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftstart, 4, "0")), "%Y-%m-%d %H%i") AND STR_TO_DATE(CONCAT(shifts.shiftdate, " ", LPAD(shifts.shiftend, 4, "0")), "%Y-%m-%d %H%i")');
                            });
                        });
                    }
                )
                ->whereBetween('date', [$startDate, $endDate])
                ->where(function($query){
                    $query->where('apex_data.answered','=','1');
                    $query->orWhere('apex_data.type','<>','Queue');
                })
                ->groupBy('apex_data.hr_id', 'shifts.shiftcat', 'shifts.shiftloc'),
            'apex_data',
            function ($join) {
                $join->on('hr.hr_id', '=', 'apex_data.hr_id');
                $join->on('shifts.shiftcat', '=', 'apex_data.shiftcat');
                $join->on('shifts.shiftloc', '=', 'apex_data.shiftloc');
            }
        )
        ->select(DB::raw("
            users.name AS agent,
            hr.hr_id, 
            IF(hr.leave_date IS NOT NULL, true, false) AS leaver,
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
            (
                IFNULL(SUM(timesheet_master.worked_minutes_master), 0) +
                IFNULL(SUM(timesheet_today.worked_minutes_today), 0)
            ) / 60 AS worked_duration_hours_excl_breaks,
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
            IFNULL(
                (
                    (
                        IFNULL(SUM(timesheet_master.worked_minutes_master), 0) +
                        IFNULL(SUM(timesheet_today.worked_minutes_today), 0)
                    ) /
                    (
                        IFNULL(SUM(shifts.shift_duration_hours), 0) +
                        (IFNULL(SUM(timesheet_master.surplus_minutes_master), 0) + IFNULL(SUM(timesheet_today.surplus_minutes_today), 0)) -
                        IFNULL(SUM(events.reduced_minutes), 0)
                    )
                ) * 100, 0
            ) AS worked_percentage_excl_breaks,
            IFNULL(SUM(shifts.late_count), 0) AS shifts_late,
            IFNULL((SUM(shifts.late_count) / SUM(shifts.shifts_scheduled)) * 100, 0) AS late_percentage,
            IFNULL(SUM(events.sick_count), 0) AS shifts_sick,
            IFNULL((SUM(events.sick_count) / SUM(shifts.shifts_scheduled)) * 100, 0) AS sick_percentage,
            IFNULL(SUM(events.awol_count), 0) AS shifts_awol,
            IFNULL((SUM(events.awol_count) / SUM(shifts.shifts_scheduled)) * 100, 0) AS awol_percentage,
            IFNULL(SUM(events.absent_count), 0) AS shifts_absent,
            IFNULL((SUM(events.absent_count) / SUM(shifts.shifts_scheduled)) * 100, 0) AS absent_percentage,
            IFNULL(SUM(events.total_absence_days), 0) AS total_absence_days,
            shifts.shiftcat as shift_category,
            shifts.shiftloc as shift_location,
            IFNULL(SUM(timesheet_master.worked_minutes_master), 0) + IFNULL(SUM(timesheet_today.worked_minutes_today), 0) as worked_duration_minutes,
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
                            IFNULL(SUM(timesheet_master.worked_minutes_master), 0) +
                            IFNULL(SUM(timesheet_today.worked_minutes_today), 0)
                        )
                    ) 
            ) * 100, 0) as utilisation
        "))
        ->where('shifts.shifts_scheduled', '>', 0)
        ->orWhere(function ($query) {
            $query->where('timesheet_master.worked_minutes_master', '>', 0)
            ->orWhere('timesheet_today.worked_minutes_today', '>', 0);
        })
        ->groupBy('hr.hr_id')
        ->groupBy('shifts.shiftcat', 'shifts.shiftloc')
        ->orderBy('agent')
        ->get();

        // Merge Bradford factors with main data
        $bradfordFactorsIndexed = $bradfordFactors->keyBy('hr_id');
        
        foreach ($data as $row) {
            $bradfordData = $bradfordFactorsIndexed->get($row->hr_id);
            $row->absence_spells = $bradfordData ? $bradfordData->absence_spells : 0;
            $row->bradford_factor = $bradfordData ? $bradfordData->bradford_factor : 0;
        }

        $targets = DB::connection('wings_config')->table('reports')->where('client','ANGL')->where('campaign', 'Attendence Report')->value('targets');
                
        return response()->json(['data' => $data, 'targets' => json_decode($targets, true)]);
    }

    public function hoursComparisonReport(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        // Fetch shifts for the date range
        $data = DB::connection('halo_rota')
        ->table('shifts2 as shifts')
        ->leftJoin('wings_data.hr_details', 'shifts.hr_id', '=', 'hr_details.hr_id')
        ->leftJoinSub(
            DB::table('apex_data.timesheet_master')
                ->select('timesheet_master.hr_id', 'date', DB::raw('
                    SUM(IF(hr_details.rank IS NULL OR hr_details.rank = "", TIMESTAMPDIFF(SECOND, on_time, off_time), 0)) / 60 AS agent_worked_minutes_master,
                    SUM(IF(hr_details.rank IS NOT NULL OR hr_details.rank != "", TIMESTAMPDIFF(SECOND, on_time, off_time), 0)) / 60 AS management_worked_minutes_master
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
                    SUM(IF(hr_details.rank IS NULL OR hr_details.rank = "", TIMESTAMPDIFF(SECOND, on_time, IFNULL(off_time, NOW())), 0)) / 60 AS agent_worked_minutes_today,
                    SUM(IF(hr_details.rank IS NOT NULL OR hr_details.rank != "", TIMESTAMPDIFF(SECOND, on_time, IFNULL(off_time, NOW())), 0)) / 60 AS management_worked_minutes_today
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
                ) * 100, 0) as utilisation,
            shifts.shiftcat as shift_category,
            shifts.shiftloc as shift_location
        "))
        ->groupBy('shifts.shiftdate', 'shifts.shiftcat', 'shifts.shiftloc')
        ->get();

        $targets = DB::connection('wings_config')->table('reports')->where('client','ANGL')->where('campaign', 'Hours Comparison Report')->value('targets');
                
        return response()->json(['data' => $data, 'targets' => json_decode($targets, true)]);
    }

    public function eventLog(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('wings_data')
        ->table('apex_data.events')
        ->leftJoin('wings_config.users as logged_by', 'logged_by.id', '=', 'events.created_by_user_id')
        ->leftJoin('wings_config.users as users', 'users.id', '=', 'events.user_id')
        ->leftJoinSub(
            DB::table('halo_rota.shifts2')
                ->select(
                    'hr_id',
                    'shiftdate',
                    'shiftstart',
                    'shiftend',
                    'shiftcat',
                    'shiftloc',
                )
                ->groupBy('hr_id', 'shiftdate'),
            'shifts',
            function ($join) {
                $join->on('apex_data.events.hr_id', '=', 'shifts.hr_id')
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
        ->whereBetween('events.date', [$startDate, $endDate])
        ->select(DB::raw("
            users.name AS agent,
            logged_by.name AS logged_by,
            events.created_at as logged_at,
            TIMESTAMPDIFF(SECOND, on_time, off_time) AS duration,
            events.category as category,
            events.notes as notes,
            shifts.shiftcat as shift_category,
            shifts.shiftloc as shift_location
        "))
        ->orderBy('events.created_at', 'desc')
        ->get();

        return response()->json(['data' => $data]);
    }

    public function smsLog(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('wings_config')
        ->table('wings_config.sms_out_log as sms_log')
        ->leftJoin('wings_config.users', 'users.id', '=', 'sms_log.user_id')
        ->whereBetween('sms_log.sent', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->select(DB::raw("
            IFNULL(users.name, 'System') AS sent_by,
            sms_log.sent as sent_at,
            sms_log.message_from as message_from,
            sms_log.message_to as message_to,
            sms_log.message as message,
            sms_log.status as status,
            sms_log.provider as provider
        "))
        ->orderBy('sms_log.sent', 'desc')
        ->get();

        return response()->json(['data' => $data]);
    }

    public function auditLog(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('wings_config')
        ->table('audit_log_pulse as audit_log')
        ->leftJoin('wings_config.users', 'users.id', '=', 'audit_log.user_id')
        ->whereBetween('audit_log.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->select(DB::raw("
            users.name AS user,
            audit_log.created_at as created_at,
            audit_log.type as type,
            audit_log.action as action,
            audit_log.notes
        "))
        ->orderBy('audit_log.created_at', 'desc')
        ->get();

        return response()->json(['data' => $data]);
    }

    public function accessLog(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('wings_config')
        ->table('access_logs as access_log')
        ->leftJoin('wings_config.users', 'users.id', '=', 'access_log.user_id')
        ->whereBetween('access_log.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->select(DB::raw("
            users.name AS user,
            access_log.created_at as created_at,
            access_log.ip_address as ip,
            access_log.url as url,
            access_log.method as method,
            access_log.user_agent as device,
            access_log.status_code as status,
            access_log.duration_ms as duration
        "))
        ->orderBy('access_log.created_at', 'desc')
        ->get();

        return response()->json(['data' => $data]);
    }

    public function siteAccessLog(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('wings_config')
        ->table('site_access_log as access_log')
        ->leftJoin('wings_config.users', 'users.id', '=', 'access_log.user_id')
        ->whereBetween('access_log.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->select(DB::raw("
            access_log.type,
            access_log.category,
            access_log.location,
            IFNULL(users.name, access_log.visitor_name) AS person,
            access_log.visitor_company as company,
            access_log.visitor_visiting as visiting,
            access_log.visitor_car_registration as car_registration,
            access_log.signed_in,
            access_log.signed_out
        "))
        ->orderBy('access_log.created_at', 'desc')
        ->get();

        Log::debug('Site Access Log Data: ', ['data' => $data]);

        return response()->json(['data' => $data]);
    }

    public function technicalSupportLog(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('wings_data')
        ->table('assets.support_log')
        ->leftJoin('wings_config.users as logged_by', 'logged_by.id', '=', 'support_log.created_by_user_id')
        ->leftJoin('wings_config.users as users', 'users.id', '=', 'support_log.user_id')
        ->whereBetween('support_log.date', [$startDate, $endDate])
        ->select(DB::raw("
            users.name AS agent,
            logged_by.name AS logged_by,
            support_log.created_at as logged_at,
            TIMESTAMPDIFF(SECOND, on_time, off_time) AS duration,
            support_log.category as title,
            support_log.notes as description,
            support_log.resolved
        "))
        ->orderBy('support_log.created_at', 'desc')
        ->get();

        return response()->json(['data' => $data]);
    }

    public function kitDetailsReport(Request $request){
        $data = DB::connection('wings_data')
        ->table('assets.kits')
        ->leftJoinSub(
            DB::table('assets.asset_log as latest_log')
                ->select('latest_log.*')
                ->join(DB::raw('(
                    SELECT kit_id, MAX(id) as max_id 
                    FROM assets.asset_log 
                    GROUP BY kit_id
                ) as max_logs'), function($join) {
                    $join->on('latest_log.kit_id', '=', 'max_logs.kit_id')
                         ->on('latest_log.id', '=', 'max_logs.max_id');
                })
                ->where('latest_log.issued', true),
            'asset_log',
            'kits.id', '=', 'asset_log.kit_id'
        )
        ->leftJoin('wings_config.users', 'users.id', '=', 'asset_log.user_id')
        ->leftJoin('assets.kit_items', 'kits.id', '=', 'kit_items.kit_id')
        ->leftJoin('assets.assets as laptop', function($join) {
            $join->on('kit_items.asset_id', '=', 'laptop.id')
                ->where('laptop.type', '=', 'Laptop');
        })
        ->leftJoin('assets.assets as telephone', function($join) {
            $join->on('kit_items.asset_id', '=', 'telephone.id')
                ->where('telephone.type', '=', 'Telephone');
        })
        ->leftJoin('assets.assets as headset', function($join) {
            $join->on('kit_items.asset_id', '=', 'headset.id')
                ->where('headset.type', '=', 'Headset');
        })
        ->select(DB::raw("
            kits.alias,
            asset_log.issued_date as issued_on,
            users.name AS issued_to,
            IFNULL(MAX(laptop.alias), '') AS laptop_alias,
            IFNULL(MAX(laptop.make), '') AS laptop_make,
            IFNULL(MAX(telephone.alias), '') AS telephone_alias,
            IFNULL(MAX(headset.alias), '') AS headset_alias,
            IF(kits.active, IF(users.name IS NULL, 'Available', 'Issued'), 'Inactive') AS status
        "))
        ->orderBy('kits.alias', 'asc')
        ->groupBy('kits.alias')
        ->get();

        return response()->json(['data' => $data]);
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

    public function totalCPASignUps(){

        $cpa_data = DB::connection('wings_config')->table('dashboard_tiles')->find(11)->data;

        $call_data = DB::connection('wings_config')->table('dashboard_tiles')->find(37)->data;

        if($cpa_data === null && $call_data === null){
            return response()->json([
                'cpa_sign_ups' => 0,
                'inbound_calls' => 0,
                'outbound_calls' => 0,
            ]);
        }

        $cpa_data = json_decode($cpa_data, true);
        $call_data = json_decode($call_data, true);

        if(!isset($cpa_data['data']['total_sign_ups']) || !is_array($cpa_data['data']['total_sign_ups'])){
            $cpa_data['data']['total_sign_ups'] = [0];
        }

        if(!isset($call_data['data']['tot_in_channels'])){
            $call_data['data']['tot_in_channels'] = 0;
        }
        if(!isset($call_data['data']['tot_out_channels'])){
            $call_data['data']['tot_out_channels'] = 0;
        }

        return response()->json([
            'cpa_sign_ups' => array_sum($cpa_data['data']['total_sign_ups']),
            'inbound_calls' => $call_data['data']['tot_in_channels'],
            'outbound_calls' => $call_data['data']['tot_out_channels'],
        ]);
    }

    // ==================== CHAT AUDIT REPORTS ====================

    public function chatMessageLog(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('pulse')
            ->table('messages')
            ->leftJoin('wings_config.users as sender', 'sender.id', '=', 'messages.sender_id')
            ->leftJoin('wings_config.users as recipient', 'recipient.id', '=', 'messages.recipient_id')
            ->leftJoin('pulse.teams', 'teams.id', '=', 'messages.team_id')
            ->leftJoin(DB::raw('(SELECT message_id, COUNT(*) as count FROM pulse.message_attachments GROUP BY message_id) as attachments'), 'attachments.message_id', '=', 'messages.id')
            ->whereBetween('messages.sent_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(DB::raw("
                messages.id,
                sender.name AS sender_name,
                IF(messages.team_id IS NOT NULL, 'team', 'dm') AS chat_type,
                COALESCE(teams.name, recipient.name) AS recipient_name,
                messages.body,
                IFNULL(attachments.count, 0) AS attachment_count,
                IF(messages.forwarded_from_message_id IS NOT NULL, 1, 0) AS is_forwarded,
                IF(messages.deleted_at IS NOT NULL, 1, 0) AS is_deleted,
                messages.sent_at
            "))
            ->orderBy('messages.sent_at', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function chatActivitySummary(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('pulse')
            ->table('messages')
            ->leftJoin('wings_config.users', 'users.id', '=', 'messages.sender_id')
            ->leftJoin(DB::raw('(SELECT message_id, COUNT(*) as count FROM pulse.message_attachments GROUP BY message_id) as attachments'), 'attachments.message_id', '=', 'messages.id')
            ->leftJoin(DB::raw('(SELECT user_id, COUNT(*) as count FROM pulse.message_reactions GROUP BY user_id) as reactions'), 'reactions.user_id', '=', 'messages.sender_id')
            ->whereBetween('messages.sent_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(DB::raw("
                users.name AS user_name,
                COUNT(*) AS total_messages,
                SUM(IF(messages.team_id IS NOT NULL, 1, 0)) AS team_messages,
                SUM(IF(messages.team_id IS NULL, 1, 0)) AS dm_messages,
                SUM(IFNULL(attachments.count, 0)) AS attachments_sent,
                MAX(IFNULL(reactions.count, 0)) AS reactions_given,
                SUM(IF(messages.forwarded_from_message_id IS NOT NULL, 1, 0)) AS messages_forwarded,
                SUM(IF(messages.deleted_at IS NOT NULL, 1, 0)) AS messages_deleted
            "))
            ->groupBy('users.id', 'users.name')
            ->orderBy('total_messages', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function teamChatActivity(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        // Calculate number of days for average
        $days = max(1, (strtotime($endDate) - strtotime($startDate)) / 86400);

        $data = DB::connection('pulse')
            ->table('teams')
            ->leftJoin('pulse.messages', function($join) use ($startDate, $endDate) {
                $join->on('teams.id', '=', 'messages.team_id')
                     ->whereBetween('messages.sent_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            })
            ->leftJoin(DB::raw('(SELECT team_id, COUNT(DISTINCT user_id) as count FROM pulse.team_user WHERE left_at IS NULL GROUP BY team_id) as members'), 'members.team_id', '=', 'teams.id')
            ->leftJoin(DB::raw('(SELECT message_id, COUNT(*) as count FROM pulse.message_attachments GROUP BY message_id) as attachments'), 'attachments.message_id', '=', 'messages.id')
            ->whereNull('teams.deleted_at')
            ->select(DB::raw("
                teams.id,
                teams.name AS team_name,
                IFNULL(members.count, 0) AS member_count,
                COUNT(messages.id) AS total_messages,
                COUNT(DISTINCT messages.sender_id) AS unique_senders,
                SUM(IFNULL(attachments.count, 0)) AS attachments_shared,
                ROUND(COUNT(messages.id) / {$days}, 1) AS avg_messages_per_day
            "))
            ->groupBy('teams.id', 'teams.name', 'members.count')
            ->orderBy('total_messages', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function dmActivity(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('pulse')
            ->table('messages')
            ->leftJoin('wings_config.users as sender', 'sender.id', '=', 'messages.sender_id')
            ->leftJoin('wings_config.users as recipient', 'recipient.id', '=', 'messages.recipient_id')
            ->whereNull('messages.team_id')
            ->whereNotNull('messages.recipient_id')
            ->whereBetween('messages.sent_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(DB::raw("
                LEAST(sender.name, recipient.name) AS user1_name,
                GREATEST(sender.name, recipient.name) AS user2_name,
                COUNT(*) AS total_messages,
                SUM(IF(sender.name = LEAST(sender.name, recipient.name), 1, 0)) AS user1_sent,
                SUM(IF(sender.name = GREATEST(sender.name, recipient.name), 1, 0)) AS user2_sent,
                MIN(messages.sent_at) AS first_message,
                MAX(messages.sent_at) AS last_message
            "))
            ->groupBy(DB::raw('LEAST(sender.name, recipient.name), GREATEST(sender.name, recipient.name)'))
            ->orderBy('total_messages', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function chatAttachmentLog(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('pulse')
            ->table('message_attachments')
            ->leftJoin('pulse.messages', 'messages.id', '=', 'message_attachments.message_id')
            ->leftJoin('wings_config.users as sender', 'sender.id', '=', 'messages.sender_id')
            ->leftJoin('wings_config.users as recipient', 'recipient.id', '=', 'messages.recipient_id')
            ->leftJoin('pulse.teams', 'teams.id', '=', 'messages.team_id')
            ->whereBetween('message_attachments.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(DB::raw("
                message_attachments.id,
                sender.name AS sender_name,
                message_attachments.file_name,
                CASE 
                    WHEN message_attachments.mime_type LIKE 'image/%' THEN 'image'
                    WHEN message_attachments.mime_type LIKE 'video/%' THEN 'video'
                    WHEN message_attachments.mime_type LIKE 'audio/%' THEN 'audio'
                    WHEN message_attachments.mime_type = 'application/pdf' THEN 'pdf'
                    ELSE 'file'
                END AS file_type,
                message_attachments.file_size,
                IF(messages.team_id IS NOT NULL, 'team', 'dm') AS chat_type,
                COALESCE(teams.name, recipient.name) AS recipient_name,
                IF(message_attachments.forwarded_from_attachment_id IS NOT NULL, 1, 0) AS is_forwarded,
                message_attachments.created_at
            "))
            ->orderBy('message_attachments.created_at', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function chatForwardedMessages(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('pulse')
            ->table('messages')
            ->join('pulse.messages as original', 'messages.forwarded_from_message_id', '=', 'original.id')
            ->leftJoin('wings_config.users as forwarder', 'forwarder.id', '=', 'messages.sender_id')
            ->leftJoin('wings_config.users as original_sender', 'original_sender.id', '=', 'original.sender_id')
            ->leftJoin('wings_config.users as recipient', 'recipient.id', '=', 'messages.recipient_id')
            ->leftJoin('pulse.teams', 'teams.id', '=', 'messages.team_id')
            ->whereNotNull('messages.forwarded_from_message_id')
            ->whereBetween('messages.sent_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(DB::raw("
                messages.id,
                forwarder.name AS forwarded_by,
                original_sender.name AS original_sender,
                original.body AS original_message,
                IF(messages.team_id IS NOT NULL, 'team', 'dm') AS forwarded_to_type,
                COALESCE(teams.name, recipient.name) AS forwarded_to_name,
                messages.sent_at AS forwarded_at
            "))
            ->orderBy('messages.sent_at', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function chatDeletedMessages(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('pulse')
            ->table('messages')
            ->leftJoin('wings_config.users as sender', 'sender.id', '=', 'messages.sender_id')
            ->leftJoin('wings_config.users as recipient', 'recipient.id', '=', 'messages.recipient_id')
            ->leftJoin('pulse.teams', 'teams.id', '=', 'messages.team_id')
            ->whereNotNull('messages.deleted_at')
            ->whereBetween('messages.deleted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(DB::raw("
                messages.id,
                sender.name AS sender_name,
                messages.body,
                IF(messages.team_id IS NOT NULL, 'team', 'dm') AS chat_type,
                COALESCE(teams.name, recipient.name) AS recipient_name,
                messages.sent_at,
                messages.deleted_at
            "))
            ->orderBy('messages.deleted_at', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function chatEditedMessages(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $data = DB::connection('pulse')
            ->table('messages')
            ->leftJoin('wings_config.users as sender', 'sender.id', '=', 'messages.sender_id')
            ->leftJoin('wings_config.users as recipient', 'recipient.id', '=', 'messages.recipient_id')
            ->leftJoin('pulse.teams', 'teams.id', '=', 'messages.team_id')
            ->leftJoin('pulse.message_edits', 'message_edits.message_id', '=', 'messages.id')
            ->where('messages.is_edited', true)
            ->whereBetween('messages.edited_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(DB::raw("
                messages.id,
                sender.name AS sender_name,
                messages.body AS current_body,
                message_edits.body AS original_body,
                (SELECT COUNT(*) FROM pulse.message_edits WHERE message_edits.message_id = messages.id) AS edit_count,
                IF(messages.team_id IS NOT NULL, 'team', 'dm') AS chat_type,
                COALESCE(teams.name, recipient.name) AS recipient_name,
                messages.sent_at,
                messages.edited_at
            "))
            ->groupBy('messages.id', 'sender.name', 'messages.body', 'message_edits.body', 'messages.team_id', 'teams.name', 'recipient.name', 'messages.sent_at', 'messages.edited_at')
            ->orderBy('messages.edited_at', 'desc')
            ->get();

        return response()->json(['data' => $data]);
    }

    /**
     * Download chat attachment from reporting
     * This bypasses the normal chat access check and uses pulse_report_chat permission instead
     */
    public function downloadChatAttachment(Request $request, $id)
    {
        $attachment = \App\Models\Chat\MessageAttachment::findOrFail($id);
        
        // Get file from storage using the AttachmentService
        $attachmentService = app(\App\Services\Chat\AttachmentService::class);
        $fileContent = $attachmentService->getFile($attachment->storage_path, $attachment->storage_driver);
        
        if (!$fileContent) {
            abort(404, 'File not found');
        }
        
        return response($fileContent, 200)
            ->header('Content-Type', $attachment->mime_type)
            ->header('Content-Disposition', 'attachment; filename="' . $attachment->file_name . '"');
    }
}
