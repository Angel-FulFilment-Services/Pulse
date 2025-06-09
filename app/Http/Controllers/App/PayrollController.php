<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use DB;
use Str;
use Log;
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
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');

        $export = [];

        $export['employees'] = Employee::select(
            'hr_details.hr_id',
            'hr_details.sage_id',
            'hr_details.halo_id',
            'hr_details.firstname',
            'hr_details.surname',
            'hr_details.dob',
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
            DB::table('hr.dow_updates')
            ->select('hr_id', DB::raw('dow as days_of_week'))
            ->where(function($query) use ($startDate, $endDate) {
                $query->where('startdate', '<=', $startDate)
                    ->where('enddate', '>=', $endDate)
                    ->orWhere(function($query) use ($startDate, $endDate) {
                        $query->where('startdate', '<=', $endDate)
                            ->where('enddate', '>=', $startDate);
                    });
            })
            ->orderBy('startdate', 'desc')
            ->groupBy('hr_id'), 
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
                DB::raw('SUM(amount) as gross_pay'),
                DB::raw('COUNT(amount) as last_qty')
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
            $holiday = $this->calculateHoliday(
                $employee->hr_id,
                $startDate,
                $endDate,
                $employee->start_date,
                $employee->leave_date,
                $employee->days_of_week,
            );

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

            if($employee->bonus > 0){
                $export['bonus'][] = [
                    'hr_id' => $employee->hr_id,
                    'sage_id' => $employee->sage_id,
                    'bonus' => round($employee->bonus, 2)
                ];
            }
        }

        return response()->json($export); 
    }

    public function payrollExport(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

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
            'gross_pay',
            'last_qty',
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
            DB::table('hr.dow_updates')
            ->select('hr_id', DB::raw('dow as days_of_week'))
            ->where(function($query) use ($startDate, $endDate) {
                $query->where('startdate', '<=', $startDate)
                    ->where('enddate', '>=', $endDate)
                    ->orWhere(function($query) use ($startDate, $endDate) {
                        $query->where('startdate', '<=', $endDate)
                            ->where('enddate', '>=', $startDate);
                    });
            })
            ->orderBy('startdate', 'desc')
            ->groupBy('hr_id'), 
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
                DB::raw('SUM(amount) as gross_pay'),
                DB::raw('COUNT(amount) as last_qty')
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
            $employee->holiday = $this->calculateHoliday(
                $employee->hr_id,
                $startDate,
                $endDate,
                $employee->start_date,
                $employee->leave_date,
                $employee->days_of_week,
            );

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
            
            if ($weekStart >= '2025-02-03' || $weeklyDiallingPercentage > 0.75) {
                if ($weeklySignUps >= 42) $incentivesEarnt += 100;
                elseif ($weeklySignUps >= 30) $incentivesEarnt += 50;
                elseif ($weeklySignUps >= 25) $incentivesEarnt += 25;
                elseif ($weeklySignUps >= 20) $incentivesEarnt += 20;
            }
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

    private function calculateHoliday($hrId, $startDate, $endDate, $startedDate, $leftDate, $dow = 0) {
        $holidays = DB::connection('hr')
        ->table('holiday_requests')
        ->select(
            'startdate',
            'enddate',
            'days_off'
        )
        ->where('hr_id', $hrId)
        ->where(function ($query) use ($startDate, $endDate) {
            $query->where('startdate', '<=', $endDate)
                ->where('enddate', '>=', $startDate);
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
        
        // Leaver calculate add in remaining entitlement
        if( $leftDate && strtotime($leftDate) > strtotime($startDate) ){
            if( strtotime($startedDate) < strtotime(date('Y-07-01', strtotime(date('m-d', strtotime($startDate)) < '07-01' ? 'last year' : 'this year', strtotime($startDate)))) ){
                $startedDate = date('Y-07-01', strtotime(date('m-d', strtotime($startDate)) < '07-01' ? 'last year' : 'this year', strtotime($startDate)));
            }

            switch ($dow) {
                case 5:
                    return (((strtotime($leftDate) - strtotime($startedDate)) / 86400) * 0.0767123) - $holidays->sum('days_off');
                    break;
                case 4: 
                    return (((strtotime($leftDate) - strtotime($startedDate)) / 86400) * 0.0613699) - $holidays->sum('days_off');
                    break;
                case 3:
                    return (((strtotime($leftDate) - strtotime($startedDate)) / 86400) * 0.0460274) - $holidays->sum('days_off');
                    break;
                case 2:
                    return (((strtotime($leftDate) - strtotime($startedDate)) / 86400) * 0.0306849) - $holidays->sum('days_off');
                    break;
                case 1:
                    return (((strtotime($leftDate) - strtotime($startedDate)) / 86400) * 0.0153425) - $holidays->sum('days_off');
                    break;
            }
        }

        return $holidays->sum('days_off');
    }

    private function calculateHolidayPay($hrId, $dow, $holiday, $grossPay, $lastQty, $leftDate = null, $startDate = null) {
        if ($holiday <= 0 || $lastQty <= 0) {
            return 0;
        }

        $dailyRate = 0;

        switch ($lastQty) {
            case 3:
                $averageMonthlyPay = $grossPay / 3;
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

    private function getCPAData($startDate, $endDate) {
        $apexData = DB::connection('apex_data')
        ->table('apex_data')
        ->join(DB::raw('halo_config.ddi as ddis'), 'apex_data.ddi', '=', 'ddis.ddi')
        ->where('ddis.wings_camp', 'LIKE', '%CPA%')
        ->whereBetween('date',[date('Y-m-d', strtotime('monday this week', strtotime($startDate))), $endDate])
        ->where(function($query){
            $query->where('apex_data.presented','=','1');
            $query->orWhere('apex_data.type','<>','Dial');
        })
        ->whereNotIn('apex_data.type',['Spy', 'Int-In', 'Int-Out'])
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
                continue;
            }

            $key = array_search('total_sign_ups', array_column($template, 'id'));
            if ($key !== false) {
                $products = $template[$key]['where'];
                if(!is_array($products)){
                    $products = [$products];
                }
            }else{
                $products = ['PDD'];
            }

            if(Schema::connection('halo_data')->hasTable($orders) && Schema::connection('halo_data')->hasTable($customers)){
                $haloData = DB::connection('halo_data')
                ->Table($orders.' as ords')
                ->whereNotIn('cust.status',['DELE','TEST','NAUT'])
                ->whereBetween('date',[date('Y-m-d', strtotime('monday this week', strtotime($startDate))), $endDate])
                ->whereIn('ords.ddi', $campaign->ddis)
                ->whereIn('ords.product', $products)
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

    public function exceptions(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
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
}
