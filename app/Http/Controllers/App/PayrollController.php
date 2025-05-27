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
                Log::debug('Invalid template for campaign: ' . $campaign->client . '-' . $campaign->wings_camp);
                continue;
            }

            $key = array_search('total_sign_ups', array_column($template, 'id'));
            if ($key !== false) {
                $products = $template[$key]['where'];
                if(!is_array($products)){
                    $products = [$products];
                }

                Log::debug('Products found for campaign: ' . $campaign->client . '-' . $campaign->wings_camp . ' - ' . implode(', ', $products));
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

        $data = Employee::where('start_date', '>=', $startDate)
        ->orWhere(function($query) use ($startDate, $endDate) {
            $query->whereBetween('leave_date', [$startDate, $endDate])
                    ->orWhereNull('leave_date');
        })
        ->select(
            'sage_id',
            'hr_details.hr_id',
            'firstname',
            'surname',
            'dob',
            'start_date',
            'leave_date',
            'halo_id',
            DB::raw('SUM(TIMESTAMPDIFF(SECOND, timesheet.on_time, timesheet.off_time)) / 60 / 60 as hours'),
            DB::raw('DATEDIFF(COALESCE(leave_date, NOW()), start_date) as length_of_service'),
            DB::raw('SUM(holiday.days_off) as holiday'),
        )
        ->leftJoin('hr.holiday_requests as holiday', function($query) use ($startDate, $endDate) {
            $query->on('hr_details.hr_id', '=', 'holiday.hr_id')
            ->where(function($query) use ($startDate, $endDate) {
                $query->where('holiday.startdate', '<=', $endDate)
                    ->where('holiday.enddate', '>=', $startDate);
            });
        })
        ->leftJoin('apex_data.timesheet_master as timesheet', function($query) use ($startDate, $endDate) {
            $query->on('hr_details.hr_id', '=', 'timesheet.hr_id')
                ->whereBetween('timesheet.on_time', [$startDate, $endDate]);
        })
        ->groupBy('hr_details.hr_id')
        ->get();

        $haloData = isset($masterHaloData) ? $masterHaloData->get() : collect();

        $apexData = $apexData->get();

        $data = $data->map(function($employee) use ($haloData, $apexData, $startDate, $endDate) {
            $employee->bonus = $this->calculateIncentives(
                $employee->hr_id,
                $employee->halo_id,
                $haloData,
                $apexData,
                $startDate,
                $endDate
            );
            return $employee;
        });

        return response()->json(['data' => $data]); 
    }

    private function calculateIncentives($hr_id, $halo_id, $haloData, $apexData, $startDate, $endDate)
    {   

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
}
