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
        $this->middleware(['has.permission:pulse_view_reporting']);
        $this->middleware(['log.access']);
    }

    public function index(Request $request){
        return Inertia::render('Payroll/Payroll');
    }

    public function payrollExport(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $apexData = DB::connection('apex_data')
        ->table('apex_data')
        ->join(DB::raw('halo_config.ddi as ddis'), 'apex_data.ddi', '=', 'ddis.ddi')
        ->where('ddis.wings_camp', 'LIKE', '%CPA%')
        ->whereBetween('date',[$startDate, $endDate])
        ->where(function($query){
            $query->where('apex_data.presented','=','1');
            $query->orWhere('apex_data.type','<>','Dial');
        })
        ->whereNotIn('apex_data.type',['Spy', 'Int-In', 'Int-Out'])
        ->groupBy('date')
        ->groupBy('hr_id')
        ->orderBy('date')
        ->select(DB::raw('count(apex_data.unq_id) as diallings, apex_data.date, apex_data.hr_id'));

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

        $completed = [];

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
                continue;
            }

            if(Schema::connection('halo_data')->hasTable($orders) && Schema::connection('halo_data')->hasTable($customers)){
                $haloData = DB::connection('halo_data')
                ->Table($orders.' as ords')
                ->whereNotIn('cust.status',['DELE','TEST','NAUT'])
                ->whereBetween('date',[$startDate, $endDate])
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

            $completed[] = $campaign->client . '-' . $campaign->wings_camp;
        }

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
            DB::raw('COALESCE(exceptions.exception_count, 0) as exception_count')
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
            ->where('type', '!=', 'Holiday')
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
                DB::raw('SUM(IF(type <> "Adhoc Bonus", 1, 0)) as exception_count')
            )
            ->whereBetween('startdate', [$startDate, $endDate])
            ->groupBy('hr_id'),
            'exceptions',
            function($join) {
                $join->on('hr_details.hr_id', '=', 'exceptions.hr_id');
            }
        )
        ->whereNull('employment_category')
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

        $haloData = isset($masterHaloData) ? $masterHaloData->get() : collect();

        $apexData = $apexData->get();

        $data = $data->map(function($employee) use ($haloData, $apexData, $startDate, $endDate) {
            $employee->bonus += $this->calculateBonus(
                $employee->hr_id,
                $employee->halo_id,
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
            $employee->holiday_pay = $this->calculateHolidayPay(
                $employee->hr_id,
                $employee->days_of_week,
                $employee->holiday,
                $employee->gross_pay,
                $employee->last_qty,
                $employee->leave_date,
                $employee->start_date,
            );

            return $employee;
        });

        return response()->json(['data' => $data]); 
    }

    private function calculateBonus($hr_id, $halo_id, $haloData, $apexData, $startDate, $endDate){   

        // Filter for this hr_id and date range
        $sign_ups = $haloData->where('halo_id', $halo_id)
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('sign_ups');
        $diallings = $apexData->where('hr_id', $hr_id)
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('diallings');

        $dialling_percentage = ($diallings > 0) ? round(($sign_ups / $diallings) * 100, 2) : 0;

        // Monthly incentive logic
        if ($dialling_percentage >= 1) {
            $incentives_earnt = $sign_ups * 1.5;
        } elseif ($dialling_percentage >= 0.75) {
            $incentives_earnt = $sign_ups * 1;
        } else {
            $incentives_earnt = 0;
        }

        $weeks = $this->calculate_weekly_periods($startDate, $endDate);
        foreach ($weeks as $week) {
            $weekStart = $week['startdate'];
            $weekEnd = $week['enddate'];
        
            $weekly_sign_ups = $haloData->where('halo_id', $halo_id)
                ->whereBetween('date', [$weekStart, $weekEnd])
                ->sum('sign_ups');
            $weekly_diallings = $apexData->where('hr_id', $hr_id)
                ->whereBetween('date', [$weekStart, $weekEnd])
                ->sum('diallings');
            $weekly_dialling_percentage = ($weekly_diallings > 0) ? round(($weekly_sign_ups / $weekly_diallings) * 100, 2) : 0;
        
            if ($weekStart >= '2025-02-03' || $weekly_dialling_percentage > 0.75) {
                if ($weekly_sign_ups >= 42) $incentives_earnt += 100;
                elseif ($weekly_sign_ups >= 30) $incentives_earnt += 50;
                elseif ($weekly_sign_ups >= 25) $incentives_earnt += 25;
                elseif ($weekly_sign_ups >= 20) $incentives_earnt += 20;
            }
        }

        return $incentives_earnt;
    }

    function calculate_weekly_periods($startdate, $enddate) {
        $startdate = strtotime($startdate);
        $enddate = strtotime($enddate);
        $weeks = [];
    
        // Adjust the start date to the beginning of the week (Monday)
        $current_startdate = strtotime('monday this week', $startdate);
    
        while (strtotime('sunday this week', $current_startdate) <= $enddate) {
            $current_enddate = strtotime('sunday this week', $current_startdate);
    
            $weeks[] = [
                'startdate' => date('Y-m-d', $current_startdate),
                'enddate' => date('Y-m-d', $current_enddate)
            ];
    
            // Move to the next week
            $current_startdate = strtotime('monday next week', $current_startdate);
        }
    
        return $weeks;
    }

    private function calculateHoliday($hr_id, $startDate, $endDate, $startedDate, $leftDate, $dow = 0) {
        $holidays = DB::connection('hr')
        ->table('holiday_requests')
        ->select(
            'startdate',
            'enddate',
            'days_off'
        )
        ->where('hr_id', $hr_id)
        ->where(function ($query) use ($startDate, $endDate) {
            $query->where('startdate', '<=', $endDate)
                ->where('enddate', '>=', $startDate);
        })
        ->where('approved', 'Y')
        ->where('type', '=', 'Paid Annual Leave')
        ->get();

        $holidays = $holidays->map(function($holiday) use ($startDate, $endDate) {
            $lv_days = 0;
            $lv_decimal = false;
            $lv_adjustment = false;
            $original_days_off = $holiday->days_off;
        
            $start = strtotime($holiday->startdate);
            $end = strtotime($holiday->enddate);
            $real_start = strtotime($startDate);
            $real_end = strtotime($endDate);
        
            // If enddate > lp_real_enddate
            if ($end > $real_end) {
                for ($i = 0; $i < ($real_end + 86400) - $start; $i += 86400) { // +1 day for inclusive
                    if ($lv_days < $original_days_off) {
                        $lv_days++;
                    }
                }
                $lv_decimal = true;
                $lv_adjustment = true;
            }
        
            // If startdate <= lp_real_startdate
            if ($start <= $real_start) {
                for ($i = 0; $i < ($real_start - $start); $i += 86400) {
                    if ($lv_days < $original_days_off) {
                        $lv_days++;
                    }
                }
                $lv_days = ($original_days_off - $lv_days);
                $lv_adjustment = true;
            }
        
            // Final adjustment
            if ($lv_adjustment && $lv_days != $original_days_off) {
                $decimal_part = $original_days_off - intval($original_days_off);
                if ($lv_decimal && $decimal_part >= 0.01 && $decimal_part <= 0.99) {
                    $holiday->days_off = $lv_days + $decimal_part;
                } else {
                    $holiday->days_off = $lv_days;
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

    private function calculateHolidayPay($hr_id, $dow, $holiday, $gross_pay, $last_qty, $leftDate = null, $startDate = null) {
        if ($holiday <= 0 || $last_qty <= 0) {
            return 0;
        }

        $daily_rate = 0;

        switch ($last_qty) {
            case 3:
                $average_monthly_pay = $gross_pay / 3;
                $annual_pay = $average_monthly_pay * 12;
                $weekly_pay = $annual_pay / 52;
                $daily_rate = $weekly_pay / $dow;
                break;    
            case 2:
                $average_monthly_pay = $gross_pay / 2;
                $annual_pay = $average_monthly_pay * 12;
                $weekly_pay = $annual_pay / 52;
                $daily_rate = $weekly_pay / $dow;
                break;
            case $last_qty == 1 && $leftDate && strtotime($leftDate) > strtotime($startDate):
                $daily_rate = $gross_pay * 0.1207;
                break;
        }

        if($daily_rate <= 0){
            return 0;
        }

        return round($daily_rate * $holiday, 2);
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
