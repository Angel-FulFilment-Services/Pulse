<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;
use Str;
use Log;
use DateTime;
use App\Helper\Auditing;
use App\Models\HR\Employee;
use App\Models\Payroll\Exception;
use Schema;

class PayrollController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['has.permission:pulse_view_payroll']);
        $this->middleware(['log.access']);
    }

    public function index(Request $request){
        return Inertia::render('Payroll/Payroll');
    }

    public function payrollExportSage(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('startDate')));
        $endDate = date("Y-m-d", strtotime($request->query('endDate')));

        $export = [];

        $export['employees'] = Employee::select(
            'hr_details.hr_id',
            'hr_details.sage_id',
            'hr_details.halo_id',
            'hr_details.firstname',
            'hr_details.surname',
            'hr_details.dob',
            'hr_details.pay_rate',
            'gross_pay',
            'last_qty',
            DB::raw('COALESCE(dow.days_of_week, 0) as days_of_week'),
            DB::raw('COALESCE(angel_cpa_agents.is_cpa_agent, false) as is_cpa_agent')
        )
        ->leftJoinSub(
            DB::connection('hr')
            ->table('exceptions')
            ->select(
                'hr_id',
            )
            ->whereBetween('startdate', [$startDate, $endDate])
            ->where('type', '!=', 'Adhoc Bonus')
            ->groupBy('hr_id'),
            'exceptions',
            function($join) {
                $join->on('hr_details.hr_id', '=', 'exceptions.hr_id');
            }
        )
        ->leftJoinSub(
            DB::table('hr.dow_updates as d1')
            ->select('d1.hr_id', DB::raw('d1.dow as days_of_week'))
            ->whereRaw('
                d1.uid = 
                    (
                        SELECT 
                            MAX(d2.uid) 
                        FROM hr.dow_updates d2 
                        WHERE 
                            d2.hr_id = d1.hr_id AND 
                            (
                                (
                                    (
                                        (d2.enddate BETWEEN ? AND ?) OR 
                                        (d2.startdate BETWEEN ? AND ?)
                                    ) OR
                                    (
                                        (d2.startdate <= ? AND (d2.enddate >= ? OR d2.enddate IS NULL))
                                    )
                                ) OR
                                (
                                    SELECT COUNT(*) 
                                    FROM hr.dow_updates d3 
                                    WHERE d3.hr_id = d1.hr_id AND 
                                    (
                                        (
                                            (d3.enddate BETWEEN ? AND ?) OR 
                                            (d3.startdate BETWEEN ? AND ?)
                                        ) OR
                                        (
                                            (d3.startdate <= ? AND (d3.enddate >= ? OR d3.enddate IS NULL))
                                        )
                                    )
                                ) = 0
                            )
                    )',
                [$startDate, $endDate, $startDate, $endDate, $startDate, $endDate, $startDate, $endDate, $startDate, $endDate, $startDate, $endDate]
            )
            ->groupBy('d1.hr_id'),
            'dow',
            function($join) {
                $join->on('hr_details.hr_id', '=', 'dow.hr_id');
            }
        )
        ->leftJoinSub(
            DB::connection('hr')
            ->table('gross_pay')
            ->select(
                'hr_id',
                DB::raw('ROUND(SUM(gross_pay_pre_sacrifice), 2) as gross_pay'),
                DB::raw('COUNT(gross_pay_pre_sacrifice) as last_qty')
            )
            ->whereBetween('startdate', [date('Y-m-d', strtotime('-4 months', strtotime($endDate))), date('Y-m-d', strtotime('-1 month', strtotime($endDate)))])
            ->groupBy('hr_id'),
            'gross_pay',
            function($join) {
                $join->on('hr_details.hr_id', '=', 'gross_pay.hr_id');
            }
        )->leftJoinSub(
            DB::connection('wings_config')
            ->table('assigned_permissions')
            ->select(
                'user_id',
                DB::raw('true as is_cpa_agent'),
            )
            ->where('right', '=', 'angel_cpa_agent')
            ->groupBy('user_id'),
            'angel_cpa_agents',
            function($join) {
                $join->on('hr_details.user_id', '=', 'angel_cpa_agents.user_id');
            }
        )
        ->whereNull('employment_category') // Exclude employees with an employment category (Back Office).
        ->whereNull('leave_date') // Exclude leavers.
        ->whereNull('exceptions.hr_id') // Exclude employees with exceptions in the date range.
        ->where(function($query) use ($startDate, $endDate) {
            $query->whereNull('hr_details.hold') // Exclude employees on hold.
                ->orWhere('hr_details.hold', '=', false); // Include employees not on hold.
        })
        ->where('hr_details.sage_id', '>', 0) // Exclude employees without a Sage ID.
        // ->where('dow.days_of_week', '!=', 0) // Employee must work at least 1 day of the week to calculate holiday pay.
        // ->where('last_qty', '>', 1) // We must hold at least 2 months of gross pay data on employee to caclulate holiday pay.
        ->get();

        $export['hours'] = DB::connection('apex_data')
        ->table('timesheet_master')
        ->leftJoin('wings_data.hr_details', 'hr_details.hr_id', '=', 'timesheet_master.hr_id')
        ->select(
            'timesheet_master.hr_id',
            'hr_details.sage_id',
            DB::raw('CAST(on_time AS DATE) as date'),
            DB::raw('SUM(TIMESTAMPDIFF(SECOND, on_time, off_time)) / 60 / 60 as hours')
        )
        ->where('type', '!=', 'H')
        ->whereBetween('on_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->groupBy('timesheet_master.hr_id')
        ->groupBy('date')
        ->get();

        $export['holiday'] = [];
        foreach($export['employees'] as $key => $employee){
            $holiday = round($this->calculateHoliday(
                $employee->hr_id,
                $startDate,
                $endDate,
                $employee->start_date,
                $employee->leave_date,
                $employee->days_of_week,
            ), 2);

            if( $holiday <= 0){
                continue;
            }

            if( $employee->days_of_week == 0 || $employee->last_qty <= 1 ){
                $export['employees']->forget($key);
                continue;
            }

            $export['holiday'][] = [
                'hr_id' => $employee->hr_id,
                'sage_id' => $employee->sage_id,
                'days' => $holiday,
                'holiday' => round($this->calculateHolidayPay(
                    $employee->hr_id,
                    $employee->days_of_week,
                    $holiday,
                    $employee->gross_pay,
                    $employee->last_qty,
                    $employee->leave_date,
                    $employee->start_date
                ), 2),
            ];
        }

        $export['employees'] = $export['employees']->values();

        $cpaData = $this->getCPAData($startDate, $endDate);
        $haloData = $cpaData['halo_data'] ?? collect();
        $apexData = $cpaData['apex_data'] ?? collect();

        $export['bonus'] = [];
        foreach($export['employees'] as $employee){
            $employee->bonus = $this->calculateBonus(
                $employee->hr_id,
                $employee->halo_id,
                $employee->is_cpa_agent,
                $haloData,
                $apexData,
                $startDate,
                $endDate
            );

            $adhocBonus = Exception::where('hr_id', $employee->hr_id)
                ->where('type', 'Adhoc Bonus')
                ->whereBetween('startdate', [$startDate, $endDate])
                ->sum('amount');

            if($employee->bonus > 0 || $adhocBonus > 0){
                $export['bonus'][] = [
                    'hr_id' => $employee->hr_id,
                    'sage_id' => $employee->sage_id,
                    'bonus' => round($employee->bonus + $adhocBonus, 2)
                ];
            }
        }

        return response()->json($export); 
    }

    public function payrollExport(Request $request){
        $startDate = date('Y-m-d', strtotime($request->query('start_date')));
        $endDate = date('Y-m-d', strtotime($request->query('end_date')));

        $cpaData = $this->getCPAData($startDate, $endDate);
        $apexData = $cpaData['apex_data'] ?? collect();
        $haloData = $cpaData['halo_data'] ?? collect();

        $data = Employee::select(
            'sage_id',
            'hr_details.hr_id',
            'firstname',
            'surname',
            'dob',
            'start_date',
            'leave_date',
            'halo_id',
            'pay_rate',
            'gross_pay',
            'last_qty',
            'hold',
            DB::raw('COALESCE(timesheet.total_hours, 0) as hours'),
            DB::raw('COALESCE(dow_updates.days_of_week, 0) as days_of_week'),
            DB::raw('DATEDIFF(COALESCE(leave_date, NOW()), start_date) as length_of_service'),
            DB::raw('COALESCE(exceptions.ssp_qty, 0) as ssp_qty'),
            DB::raw('COALESCE(exceptions.spp_qty, 0) as spp_qty'),
            DB::raw('COALESCE(exceptions.pilon_qty, 0) as pilon_qty'),
            DB::raw('COALESCE(exceptions.od_amount_qty, 0) as od_amount_qty'),
            DB::raw('COALESCE(exceptions.od_days_qty, 0) as od_days_qty'),
            DB::raw('COALESCE(exceptions.adhoc_qty, 0) as adhoc_qty'),
            DB::raw('COALESCE(exceptions.adhoc_amount, 0) as bonus'),
            DB::raw('COALESCE(exceptions.exception_count, 0) as exception_count'),
            DB::raw('COALESCE(angel_cpa_agents.is_cpa_agent, false) as is_cpa_agent'),
            DB::raw('COALESCE(hr_details.employment_category, "HOURLY") as employment_category'),
            DB::raw('COALESCE(exceptions.items, JSON_ARRAY()) as items')
        )
        ->leftJoinSub(
            DB::table('hr.dow_updates as d1')
            ->select('d1.hr_id', DB::raw('d1.dow as days_of_week'))
            ->whereRaw('
                d1.uid = 
                    (
                        SELECT 
                            MAX(d2.uid) 
                        FROM hr.dow_updates d2 
                        WHERE 
                            d2.hr_id = d1.hr_id AND 
                            (
                                (
                                    (
                                        (d2.enddate BETWEEN ? AND ?) OR 
                                        (d2.startdate BETWEEN ? AND ?)
                                    ) OR
                                    (
                                        (d2.startdate <= ? AND (d2.enddate >= ? OR d2.enddate IS NULL))
                                    )
                                ) OR
                                (
                                    SELECT COUNT(*) 
                                    FROM hr.dow_updates d3 
                                    WHERE d3.hr_id = d1.hr_id AND 
                                    (
                                        (
                                            (d3.enddate BETWEEN ? AND ?) OR 
                                            (d3.startdate BETWEEN ? AND ?)
                                        ) OR
                                        (
                                            (d3.startdate <= ? AND (d3.enddate >= ? OR d3.enddate IS NULL))
                                        )
                                    )
                                ) = 0
                            )
                    )',
                [$startDate, $endDate, $startDate, $endDate, $startDate, $endDate, $startDate, $endDate, $startDate, $endDate, $startDate, $endDate]
            )
            ->groupBy('d1.hr_id'),
            'dow_updates',
            function($join) {
                $join->on('hr_details.hr_id', '=', 'dow_updates.hr_id');
            }
        )
        ->leftJoinSub(
            DB::connection('apex_data')
            ->table('timesheet_master')
            ->select(
                'hr_id',
                DB::raw('SUM(TIMESTAMPDIFF(SECOND, on_time, off_time)) / 60 / 60 as total_hours')
            )
            ->where('type', '!=', 'H')
            ->whereBetween('on_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->groupBy('hr_id'), 
            'timesheet', 
            function($join) {
                $join->on('hr_details.hr_id', '=', 'timesheet.hr_id');
            }
        )
        ->leftJoinSub(
            DB::connection('hr')
            ->table('gross_pay')
            ->select(
                'hr_id',
                DB::raw('ROUND(SUM(gross_pay_pre_sacrifice), 2) as gross_pay'),
                DB::raw('COUNT(gross_pay_pre_sacrifice) as last_qty')
            )
            ->whereBetween('startdate', [date('Y-m-d', strtotime('-4 months', strtotime($endDate))), date('Y-m-d', strtotime('-1 month', strtotime($endDate)))])
            ->groupBy('hr_id'),
            'gross_pay',
            function($join) {
                $join->on('hr_details.hr_id', '=', 'gross_pay.hr_id');
            }
        )
        ->leftJoinSub(
            DB::connection('hr')
            ->table('exceptions')
            ->select(
                'hr_id',
                DB::raw('SUM(IF(type = "Statutory Sick Pay", days, 0)) as ssp_qty'),
                DB::raw('SUM(IF(type = "Statutory Paternity Pay", days, 0)) as spp_qty'),
                DB::raw('SUM(IF(type = "Payment In Lieu of Notice", amount, 0)) as pilon_qty'),
                DB::raw('SUM(IF(type = "Other Deductions", amount, 0)) as od_amount_qty'),
                DB::raw('SUM(IF(type = "Other Deductions", days, 0)) as od_days_qty'),
                DB::raw('SUM(IF(type = "Adhoc Bonus", 1, 0)) as adhoc_qty'),
                DB::raw('SUM(IF(type = "Adhoc Bonus", amount, 0)) as adhoc_amount'),
                DB::raw('SUM(IF(type <> "Adhoc Bonus", 1, 0)) as exception_count'),
                DB::raw('
                    JSON_ARRAYAGG(
                        CASE 
                            WHEN type != "Adhoc Bonus" 
                            THEN JSON_OBJECT(
                                "id", id, 
                                "notes", COALESCE(notes, type),
                                "payment", IF(
                                    type IN ("Statutory Sick Pay", "Statutory Paternity Pay", "Payment In Lieu of Notice"), 
                                    IF(amount > 0, 
                                        CONCAT("£", COALESCE(amount, 0)),
                                        CONCAT(COALESCE(days, 0), " days") 
                                    ), 
                                    NULL
                                ),
                                "deduction", IF(
                                    type NOT IN ("Statutory Sick Pay", "Statutory Paternity Pay", "Payment In Lieu of Notice", "Adhoc Bonus"), 
                                    IF(amount > 0, 
                                        CONCAT("-£", COALESCE(amount, 0)),
                                        CONCAT("-", COALESCE(days, 0), " days")
                                    ), 
                                    NULL
                                )
                            )
                        END
                    ) AS items'
                )
            )
            ->whereBetween('startdate', [$startDate, $endDate])
            ->groupBy('hr_id'),
            'exceptions',
            function($join) {
                $join->on('hr_details.hr_id', '=', 'exceptions.hr_id');
            }
        )
        ->leftJoinSub(
            DB::connection('wings_config')
            ->table('assigned_permissions')
            ->select(
                'user_id',
                DB::raw('true as is_cpa_agent'),
            )
            ->where('right', '=', 'angel_cpa_agent')
            ->groupBy('user_id'),
            'angel_cpa_agents',
            function($join) {
                $join->on('hr_details.user_id', '=', 'angel_cpa_agents.user_id');
            }
        )
        ->where(function($query) use ($startDate, $endDate) {
            $query->where('start_date', '>=', $startDate)
                ->orWhere(function($query) use ($startDate, $endDate) {
                    $query->whereBetween('leave_date', [$startDate, $endDate])
                            ->orWhereNull('leave_date');
                });
        })
        ->where(function($query) use ($startDate, $endDate) {
            $query->where('sage_id', '>', 0)
            ->orWhere('timesheet.total_hours', '>', 0);
        })
        ->groupBy('hr_details.hr_id')
        ->get();

        $data = $data->map(function($employee) use ($haloData, $apexData, $startDate, $endDate) {
            $employee->bonus += $this->calculateBonus(
                $employee->hr_id,
                $employee->halo_id,
                $employee->is_cpa_agent,
                $haloData,
                $apexData,
                $startDate,
                $endDate
            );
            $employee->holiday = round($this->calculateHoliday(
                $employee->hr_id,
                $startDate,
                $endDate,
                $employee->start_date,
                $employee->leave_date,
                $employee->days_of_week,
            ), 2);

            if ( $employee->employment_category == 'HOURLY' ){
                $employee->holiday_pay = $this->calculateHolidayPay(
                    $employee->hr_id,
                    $employee->days_of_week,
                    $employee->holiday,
                    $employee->gross_pay,
                    $employee->last_qty,
                    $employee->leave_date,
                    $employee->start_date,
                );
            }else{
                $employee->holiday_pay = 0;
            }

            return $employee;
        });

        return response()->json(['data' => $data]); 
    }

    /**
     * Public method to calculate bonus for a single user
     * Used by UserController for payroll estimates
     */
    public function calculateBonusForUser($hrId, $haloId, $startDate, $endDate): float
    {
        // Check if user is CPA agent
        $isCpaAgent = DB::connection('wings_config')
            ->table('assigned_permissions')
            ->leftJoin('wings_data.hr_details', 'assigned_permissions.user_id', '=', 'hr_details.user_id')
            ->where('hr_details.hr_id', $hrId)
            ->where('right', 'angel_cpa_agent')
            ->exists();

        // Get CPA data for the period, filtered to this user only
        $cpaData = $this->getCPAData($startDate, $endDate, $hrId, $haloId);
        $haloData = $cpaData['halo_data'] ?? collect();
        $apexData = $cpaData['apex_data'] ?? collect();

        return $this->calculateBonus($hrId, $haloId, $isCpaAgent, $haloData, $apexData, $startDate, $endDate);
    }

    private function calculateBonus($hrId, $haloId, $isCpaAgent, $haloData, $apexData, $startDate, $endDate){   

        // Filter for this hr_id and date range
        $signUps = $haloData->where('halo_id', $haloId)
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('sign_ups');
        $diallings = $apexData->where('hr_id', $hrId)
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('diallings');

        if (!$isCpaAgent) {
            return $signUps * 0.75; // Base bonus for non-CPA agents
        }

        $diallingPercentage = ($diallings > 0) ? round(($signUps / $diallings) * 100, 2) : 0;

        // Monthly incentive logic
        if ($diallingPercentage >= 1) {
            $incentivesEarnt = $signUps * 1.5;
        } elseif ($diallingPercentage >= 0.75) {
            $incentivesEarnt = $signUps * 1;
        } else {
            $incentivesEarnt = 0;
        }

        $weeks = $this->calculateWeeklyPeriods($startDate, $endDate);
        foreach ($weeks as $week) {
            $weekStart = $week['startdate'];
            $weekEnd = $week['enddate'];

            $weeklySignUps = $haloData->where('halo_id', $haloId)
                ->whereBetween('date', [$weekStart, $weekEnd])
                ->sum('sign_ups');
            $weeklyDiallings = $apexData->where('hr_id', $hrId)
                ->whereBetween('date', [$weekStart, $weekEnd])
                ->sum('diallings');
            $weeklyDiallingPercentage = ($weeklyDiallings > 0) ? round(($weeklySignUps / $weeklyDiallings) * 100, 2) : 0;
            
            if($weeklySignUps >= 57 && $weekStart >= '2025-11-24') $incentivesEarnt += 200;
            elseif($weeklySignUps >= 50 && $weekStart >= '2025-11-24') $incentivesEarnt += 150;
            elseif($weeklySignUps >= 46 && $weekStart >= '2025-11-24') $incentivesEarnt += 125;
            elseif ($weeklySignUps >= 42) $incentivesEarnt += 100;
            elseif($weeklySignUps >= 35 && $weekStart >= '2025-11-24') $incentivesEarnt += 75;
            elseif ($weeklySignUps >= 30) $incentivesEarnt += 50;
            elseif ($weeklySignUps >= 25) $incentivesEarnt += 25;
            elseif ($weeklySignUps >= 20) $incentivesEarnt += 20;
        }

        return $incentivesEarnt;
    }

    private function calculateWeeklyPeriods($startdate, $enddate) {
        $startdate = strtotime($startdate);
        $enddate = strtotime($enddate);
        $weeks = [];
    
        // Adjust the start date to the beginning of the week (Monday)
        $currentStartdate = strtotime('monday this week', $startdate);
    
        while (strtotime('sunday this week', $currentStartdate) <= $enddate) {
            $currentEnddate = strtotime('sunday this week', $currentStartdate);
    
            $weeks[] = [
                'startdate' => date('Y-m-d', $currentStartdate),
                'enddate' => date('Y-m-d', $currentEnddate)
            ];
    
            // Move to the next week
            $currentStartdate = strtotime('monday next week', $currentStartdate);
        }
    
        return $weeks;
    }

    private function calculateHoliday($hrId, $startDate, $endDate, $startedDate, $leftDate) {
        $holidays = DB::connection('hr')
        ->table('holiday_requests')
        ->select(
            'startdate',
            'enddate',
            'days_off'
        )
        ->where('hr_id', $hrId)
        ->where(function ($query) use ($startDate, $endDate) {
            $query->whereBetween('enddate', [$startDate, $endDate])
                ->orWhereBetween('startdate', [$startDate, $endDate]);
        })
        ->where('approved', 'Y')
        ->where('type', '=', 'Paid Annual Leave')
        ->get();

        $holidays = $holidays->map(function($holiday) use ($startDate, $endDate) {
            $days = 0;
            $decimal = false;
            $adjustment = false;
            $originalDaysOff = $holiday->days_off;
        
            $start = strtotime($holiday->startdate);
            $end = strtotime($holiday->enddate);
            $realStart = strtotime($startDate);
            $realEnd = strtotime($endDate);
        
            // If enddate > real_enddate
            if ($end > $realEnd) {
                for ($i = 0; $i < ($realEnd + 86400) - $start; $i += 86400) { // +1 day for inclusive
                    if ($days < $originalDaysOff) {
                        $days++;
                    }
                }
                $decimal = true;
                $adjustment = true;
            }
        
            // If startdate <= real_startdate
            if ($start <= $realStart) {
                for ($i = 0; $i < ($realStart - $start); $i += 86400) {
                    if ($days < $originalDaysOff) {
                        $days++;
                    }
                }
                $days = ($originalDaysOff - $days);
                $adjustment = true;
            }
        
            // Final adjustment
            if ($adjustment && $days != $originalDaysOff) {
                $decimalPart = $originalDaysOff - intval($originalDaysOff);
                if ($decimal && $decimalPart >= 0.01 && $decimalPart <= 0.99) {
                    $holiday->days_off = $days + $decimalPart;
                } else {
                    $holiday->days_off = $days;
                }
            }
        
            // Clamp start/end to reporting period for output
            if ($holiday->enddate > $endDate) {
                $holiday->enddate = $endDate;
            }
            if ($holiday->startdate < $startDate) {
                $holiday->startdate = $startDate;
            }

            return $holiday;
        });
        
        $holiday = $holidays->sum('days_off');

        // Leaver calculate add in remaining entitlement
        if( $leftDate && strtotime($leftDate) >= strtotime($startDate) ){
            if( strtotime($startedDate) < strtotime(date('Y-07-01', strtotime(date('m-d', strtotime(date('Y-m-d'))) < '07-01' ? 'last year' : 'this year', strtotime(date('Y-m-d'))))) ){
                $startedDate = date('Y-07-01', strtotime(date('m-d', strtotime(date('Y-m-d'))) < '07-01' ? 'last year' : 'this year', strtotime(date('Y-m-d'))));
            }

            $holidays = DB::connection('hr')
            ->table('holiday_requests')
            ->select(
                'startdate',
                'enddate',
                'days_off'
            )
            ->where('hr_id', $hrId)
            ->where(function ($query) use ($startedDate, $endDate) {
                $query->whereBetween('enddate', [$startedDate, $endDate])
                    ->orWhereBetween('startdate', [$startedDate, $endDate]);
            })
            ->where('approved', 'Y')
            ->where('type', '=', 'Paid Annual Leave')
            ->get();

            $dow_changes  = DB::table('hr.dow_updates')
            ->select('hr_id', 'startdate', 'enddate', DB::raw('dow as days_of_week'))
            ->where('hr_id', $hrId)
            ->where(function ($query) use ($startedDate, $endDate) {
                $query->whereBetween('enddate', [$startedDate, $endDate])
                    ->orWhereBetween('startdate', [$startedDate, $endDate]);
            })
            ->orderBy('startdate', 'desc')
            ->get();

            $remainingEntitlement = 0;
            foreach($dow_changes as $dow_change){
                $entitlementStartdate = $dow_change->startdate;
                $entitlementEnddate = $dow_change->enddate;

                if( strtotime($dow_change->startdate) >= strtotime($leftDate) ){
                    continue; // Skip if the dow_change starts after the leftDate
                }

                if( strtotime($dow_change->enddate) > strtotime($leftDate) ){
                    $entitlementEnddate = $leftDate; // Clamp enddate to leftDate if it is after leftDate
                }

                switch ($dow_change->days_of_week) {
                case 5:
                    $remainingEntitlement += (((strtotime($entitlementEnddate) - strtotime($entitlementStartdate)) / 86400) * 0.0767123);
                    break;
                case 4: 
                    $remainingEntitlement += (((strtotime($entitlementEnddate) - strtotime($entitlementStartdate)) / 86400) * 0.0613699);
                    break;
                case 3:
                    $remainingEntitlement += (((strtotime($entitlementEnddate) - strtotime($entitlementStartdate)) / 86400) * 0.0460274);
                    break;
                case 2:
                    $remainingEntitlement += (((strtotime($entitlementEnddate) - strtotime($entitlementStartdate)) / 86400) * 0.0306849);
                    break;
                case 1:
                    $remainingEntitlement += (((strtotime($entitlementEnddate) - strtotime($entitlementStartdate)) / 86400) * 0.0153425);
                    break;
                }
            }

            $holiday = $remainingEntitlement - $holidays->sum('days_off') + $holiday;
        }

        return $holiday;
    }

    private function calculateHolidayPay($hrId, $dow, $holiday, $grossPay, $lastQty, $leftDate = null, $startDate = null) {
        if ($holiday <= 0 || $lastQty <= 0) {
            return 0;
        }

        $dailyRate = 0;
        $pay = 0;

        if ($dow <= 0) {
            return 0; // No days of the week worked, no holiday pay
        }

        switch ($lastQty) {
            case $lastQty >= 3:
                $averageMonthlyPay = $grossPay / $lastQty;
                $annualPay = $averageMonthlyPay * 12;
                $weeklyPay = $annualPay / 52;
                $dailyRate = $weeklyPay / $dow;

                $pay = $dailyRate * $holiday;
                break;    
            case 2:
                $averageMonthlyPay = $grossPay / 2;
                $annualPay = $averageMonthlyPay * 12;
                $weeklyPay = $annualPay / 52;
                $dailyRate = $weeklyPay / $dow;

                $pay = $dailyRate * $holiday;
                break;
            case $lastQty == 1 && $leftDate && strtotime($leftDate) > strtotime($startDate):
                $pay = $grossPay * 0.1207;

                break;
        }

        if($pay <= 0){
            return 0;
        }

        return round($pay, 2);
    }

    private function getCPAData($startDate, $endDate, $hrId = null, $haloId = null) {
        $apexData = DB::connection('apex_data')
        ->table('apex_data')
        ->join(DB::raw('halo_config.ddi as ddis'), 'apex_data.ddi', '=', 'ddis.ddi')
        ->where('ddis.wings_camp', 'LIKE', '%CPA%')
        ->whereBetween('date',[date('Y-m-d', strtotime('monday this week', strtotime($startDate))), $endDate])
        ->where('apex_data.type', 'Dial')
        ->whereNotIn('apex_data.type',['Spy', 'Int-In', 'Int-Out', 'Queue'])
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('apex_data.hr_id', $hrId);
        })
        ->groupBy('date')
        ->groupBy('hr_id')
        ->orderBy('date')
        ->select(DB::raw('count(apex_data.unq_id) as diallings, apex_data.date, apex_data.hr_id'))
        ->get();

        $campaigns = DB::connection('halo_config')
        ->table('ddi')
        ->where('wings_camp','LIKE','%CPA%')
        ->orderBy('client')
        ->select('client', 'wings_camp', 'ddi')
        ->get();

        $campaigns = $campaigns->groupBy(function($item) {
            return $item->client . '-' . $item->wings_camp;
        })->map(function($group) {
            return (object) [
                'client' => $group[0]->client,
                'wings_camp' => $group[0]->wings_camp,
                'ddis' => $group->pluck('ddi')
            ];
        });

        $clientConfiguration = DB::connection('halo_config')
            ->table('client_tables')
            ->wherein('clientref', $campaigns->pluck('client'))
            ->select('clientref as client', 'orders', 'customers')
            ->get()
            ->mapWithKeys(function($item) {
                return [$item->client => (object) $item];
            });

        foreach($campaigns as $campaign){

            $client = $clientConfiguration[$campaign->client] ?? null;

            if($client){
                $orders = $client->orders;
                $customers = $client->customers;
            }else{
                continue;
            }

            $template = DB::connection('wings_config')
            ->table('internal_reports')
            ->where('client', $campaign->client)
            ->where('campaign', $campaign->wings_camp)
            ->value('template');

            $template = json_decode($template, true);
            if (is_null($template) || !is_array($template)) {
                $products = ['PDD'];
                continue;
            } else {
                $key = array_search('total_sign_ups', array_column($template, 'id'));
                if ($key !== false) {
                    $products = $template[$key]['where'];
                    if(!is_array($products)){
                        $products = [$products];
                    }
                }else{
                    $products = ['PDD'];
                }
            }

            if(Schema::connection('halo_data')->hasTable($orders) && Schema::connection('halo_data')->hasTable($customers)){
                $haloData = DB::connection('halo_data')
                ->Table($orders.' as ords')
                ->whereNotIn('cust.status',['DELE','TEST','NAUT'])
                ->whereBetween('date',[date('Y-m-d', strtotime('monday this week', strtotime($startDate))), $endDate])
                ->whereIn('ords.ddi', $campaign->ddis)
                ->where(function ($query) use ($products, $campaign) {
                    if ($campaign->client == 'WAID') {
                        $query->whereIn('ords.halo_prod', $products);
                    } else {
                        $query->whereIn('ords.product', $products);
                    }
                })
                ->when($haloId, function ($query) use ($haloId) {
                    return $query->where('ords.operator', $haloId);
                })
                ->join(DB::raw('halo_data.' . $customers . ' as cust'),'ords.orderref','=','cust.orderref')
                ->select(
                    DB::raw('count(ords.orderref) as sign_ups'),
                    DB::raw('"' . $campaign->client . '" as client'),
                    DB::raw('"' . $campaign->wings_camp . '" as campaign'),
                    'ords.date',
                    'ords.operator as halo_id'
                )
                ->groupBy('ords.date')
                ->groupBy('ords.operator')
                ->groupBy('client')
                ->groupBy('campaign');

                $masterHaloData = isset($masterHaloData) ? $masterHaloData->union($haloData) : $haloData;
            }else{
                continue;
            }
        }

        $haloData = isset($masterHaloData) ? $masterHaloData->get() : collect();

        return [
            'apex_data' => $apexData,
            'halo_data' => $haloData
        ];
    }

    public function setTargets(Request $request){       
        
        $report = $request->report;
        if (is_null($report) || !is_array($report)) {
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

    public function exceptions(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));

        $hrId = $request->query('hr_id');

        // Fetch event records for the date range
        $events = Exception::whereBetween('startdate', [$startDate, $endDate])
        ->select('exceptions.*')
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('exceptions.hr_id', $hrId)
            ->leftJoin('wings_config.users as logged', 'logged.id', '=', 'exceptions.created_by_user_id')
            ->leftJoin('wings_config.users', 'users.id', '=', 'exceptions.user_id')
            ->addSelect('logged.name as logged_by', 'users.name as user_name');
        })
        ->get();

        return response()->json($events);
    }

    public function saveException(Request $request){

        // Define validation rules
        $rules = [
            'type' => 'required|string',
            'notes' => 'nullable|string|max:500',
            'days' => 'required_without:amount|nullable|numeric',
            'amount' => 'required_without:days|nullable|numeric',
        ];
        
        // Define custom validation messages
        $messages = [
            'type.required' => 'The type field is required.',
            'type.string' => 'The type must be a string.',
            'notes.string' => 'The notes must be a string.',
            'notes.max' => 'The notes may not be greater than 500 characters.',
            'days.required_without' => 'The days field is required if amount is not provided.',
            'days.numeric' => 'The days must be a numeric value.',
            'amount.required_without' => 'The amount field is required if days is not provided.',
            'amount.numeric' => 'The amount must be a numeric value.',
        ];

        try {
            $request->validate($rules, $messages);

            $user = Employee::where('hr_id', '=', $request->hrID)->first();

            // Process the validated data
            if ($request->exceptionID){
                Exception::find($request->exceptionID)->update([
                    'hr_id' => $request->hrID,
                    'user_id' => $user->user_id,
                    'created_by_user_id' => auth()->user()->id,
                    'date' => date("Y-m-d"),
                    'startdate' => $request->startDate,
                    'enddate' => $request->endDate,
                    'type' => $request->type,
                    'notes' => $request->notes,
                    'days' => $request->days,
                    'amount' => $request->amount,
                ]);
                Auditing::log('Payroll', auth()->user()->id, 'Payroll Exception Updated', 'Exception ID: ' . $request->exceptionID);
            }else{
                $exception = Exception::create([
                    'hr_id' => $request->hrID,
                    'user_id' => $user->user_id,
                    'created_by_user_id' => auth()->user()->id,
                    'date' => date("Y-m-d"),
                    'startdate' => $request->startDate,
                    'enddate' => $request->endDate,
                    'type' => $request->type,
                    'notes' => $request->notes,
                    'days' => $request->days,
                    'amount' => $request->amount,
                ]);
                Auditing::log('Payroll', auth()->user()->id, 'Payroll Exception Created', 'Exception ID: ' . $exception->id);
            }

            return response()->json(['message' => 'Event saved successfully!'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error saving exception: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to save exception.'], 500);
        }
    }

    public function removeException(Request $request){
        // Define validation rules
        $rules = [
            'exceptionID' => 'required|numeric',
        ];

        try {
            $exception = Exception::find($request->exceptionID);

            if($exception && $exception->delete()){
                Auditing::log('Payroll', auth()->user()->id, 'Payroll Exception Deleted', 'Exception ID: ' . $request->exceptionID);
                return response()->json(['message' => 'Exception removed successfully!'], 200);
            } else {
                return response()->json(['message' => 'Failed to remove the exception.'], 500);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error removing exception: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to remove the exception.'], 500);
        }
    }

    public function importLog(Request $request){
        $data = DB::connection('wings_config')
        ->table('audit_log_pulse as audit_log')
        ->leftJoin('wings_config.users', 'users.id', '=', 'audit_log.user_id')
        ->select(DB::raw("
            users.name AS user,
            users.id as user_id,
            audit_log.created_at as created_at,
            audit_log.type as type,
            audit_log.action as action,
            audit_log.notes
        "))
        ->where('audit_log.type', '=', 'Payroll Import')
        ->orderBy('audit_log.created_at', 'desc')
        ->get();

        return response()->json($data);
    }

    public function importGrossPay(Request $request){
        $data = $request->input('data', []);

        if (!is_array($data) || empty($data)) {
            return response()->json(['message' => 'No data provided.'], 400);
        }

        $imported = 0;
        $updated = 0;
        $errors = [];

        foreach ($data as $row) {
            // Basic validation
            if (
                empty($row['empId']) ||
                empty($row['startDate']) ||
                empty($row['endDate']) ||
                empty($row['payrollDate'])
            ) {
                continue; // skip invalid rows
            }

            // 1. Find hr_id by sage_id
            $hr = DB::connection('wings_data')
                ->table('hr_details')
                ->where('sage_id', $row['empId'])
                ->first();

            if (!$hr) {
                $errors[] = "No hr_id found for sage_id: {$row['empId']}";
                continue;
            }

            $hrId = $hr->hr_id;
            $userId = $hr->user_id;

            // 2. Check if entry exists for this hr_id and payroll period
            $existing = DB::connection('hr')
                ->table('gross_pay')
                ->where('hr_id', $hrId)
                ->where('startdate', $this->formatDate($row['startDate']))
                ->where('enddate', $this->formatDate($row['endDate']))
                ->first();

            $fields = [
                'hr_id'                     => $hrId,
                'user_id'                   => $userId, 
                'sage_id'                   => $row['empId'],
                'startdate'                 => $this->formatDate($row['startDate']),
                'enddate'                   => $this->formatDate($row['endDate']),
                'gross_pay_pre_sacrifice'   => $row['grossPayPreSacrifice'] ?? 0,
                'gross_pay_post_sacrifice'  => $row['grossPayPostSacrifice'] ?? 0,
                'taxible_gross_pay'         => $row['grossPayTaxible'] ?? 0,
                'paye_tax'                  => $row['payeTax'] ?? 0,
                'employee_nic'              => $row['payeNi'] ?? 0,
                'employer_nic'              => $row['employerNi'] ?? 0,
                'employee_pension'          => $row['payePension'] ?? 0,
                'employer_pension'          => $row['employerPension'] ?? 0,
                'student_loan'              => $row['studentLoan'] ?? 0,
                'ssp'                       => $row['ssp'] ?? 0,
                'spp'                       => $row['spp'] ?? 0,
                'net_pay'                   => $row['netPay'] ?? 0,
                'processed_date'            => $this->formatDate($row['payrollDate']),
            ];

            try {
                if ($existing) {
                    // Update existing
                    DB::connection('hr')
                        ->table('gross_pay')
                        ->where('id', $existing->id)
                        ->update($fields);
                    $updated++;
                } else {
                    // Insert new
                    DB::connection('hr')
                        ->table('gross_pay')
                        ->insert($fields);
                    $imported++;
                }
            } catch (\Exception $e) {
                $errors[] = "Error for sage_id {$row['empId']}: " . $e->getMessage();
            }
        }

        Auditing::log('Payroll Import', auth()->user()->id, 'Payroll Import - Gross Pay', json_encode([
            'imported' => $imported,
            'updated' => $updated,
            'errors' => $errors
        ]));

        return response()->json([
            'message' => 'Gross pay data processed.',
            'imported' => $imported,
            'updated' => $updated,
            'errors' => $errors,
        ]);
    }

    public function toggleHold(Request $request){
        $hrId = $request->input('hr_id');

        if (!$hrId || !is_numeric($hrId)) {
            return response()->json(['message' => 'Invalid input data.'], 400);
        }

        try {
            DB::connection('wings_data')
            ->table('hr_details')
            ->where('hr_id', $hrId)
             ->update(['hold' => DB::raw('NOT COALESCE(hold, 0)')]);

            Auditing::log('Payroll', auth()->user()->id, 'Toggled hold status', "HR ID: {$hrId}");

            return response()->json(['message' => 'Employee hold status toggled successfully.']);
        } catch (\Exception $e) {
            Log::error('Error toggling employee hold status: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to toggle employee hold status.'], 500);
        }
    }

    /**
     * Helper to format dates as Y-m-d
     */
    private function formatDate($date)
    {
        if (!$date) return null;
        $dt = DateTime::createFromFormat('d/m/Y', $date);
        return $dt ? $dt->format('Y-m-d') : null;
    }
}
