<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User\User;
use App\Models\HR\Employee;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Log;
use App\Models\Rota\Shift;
use App\Models\Rota\Event;
use App\Http\Controllers\App\PayrollController;

class UserController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        // $this->middleware(['perm.check:view_dashboard']);
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['log.access']);
    }

    public function activeStates(Request $request){
        // Fetch employees with their latest timesheet record
        $users = Employee::leftJoin('apex_data.timesheet_today as tt', 'hr_details.hr_id', '=', 'tt.hr_id')
            ->leftJoin('wings_config.users', 'hr_details.user_id', '=', 'users.id')
            ->leftJoin('pulse.user_statuses', 'hr_details.user_id', '=', 'user_statuses.user_id')
            ->select('hr_details.hr_id', 'hr_details.rank', 'hr_details.user_id', 'hr_details.profile_photo', 'user_statuses.last_active_at', 'tt.off_time', DB::raw('MAX(tt.on_time) as latest_on_time'), 'users.name', 'hr_details.job_title', 'hr_details.start_date')
            ->groupBy('hr_details.hr_id', 'tt.off_time')
            ->orderBy('tt.unq_id', 'asc')
            ->get();

        $userStates = [];

        foreach ($users as $user) {
            $lastActiveAt = null;

            if ($user->latest_on_time) {
                $lastActiveAt = $user->off_time ? $user->off_time : Date("Y-m-d H:i:s");
            }

            $userStates[$user->hr_id] = [
                'user_id' => $user->user_id,
                'name' => $user->name,
                'job_title' => $user->job_title,
                'profile_photo' => $user->profile_photo,
                'last_active_at' => $lastActiveAt,
                'pulse_last_active_at' => $user->last_active_at ?? null,
                'rank' => $user->rank,
                'new' => Carbon::parse($user->start_date)->diffInDays(Carbon::now()) <= 30,
            ];
        }

        return response()->json($userStates);
    }

    public function latestShiftDate(){
        // Get the latest shift date across all shifts
        $latestDate = Shift::max('shiftdate');
        
        return response()->json([
            'latest_date' => $latestDate
        ]);
    }

    public function shifts(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $hrId = auth()->user()->employee->hr_id;

        // Fetch shifts for the date range
        $shifts = Shift::whereBetween('shiftdate', [$startDate, $endDate])
        ->select("shifts2.*")
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('shifts2.hr_id', $hrId);
        })
        ->groupBy('hr_id','shiftdate','shiftstart','shiftend')
        ->get();

        return response()->json($shifts);
    }

    public function timesheets(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $hrId = auth()->user()->employee->hr_id;

        // Fetch timesheet_today records for the date range
        if((date('Y-m-d') >= $startDate) && (date('Y-m-d') <= $endDate)){
            $timesheetToday = DB::table('apex_data.timesheet_today')
                ->whereBetween('date', [$startDate, $endDate])
                ->whereNotIn('category', ['Holiday'])
                ->where('hr_id', '<>', '9999')
                ->when($hrId, function ($query) use ($hrId) {
                    return $query->where('hr_id', $hrId);
                })
                ->get()
                ->map(function ($record) {
                    if (is_null($record->off_time)) {
                        $record->off_time = Carbon::now();
                    }
                    return $record;
                });
        }

        // Fetch timesheet_master records for the date range
        $timesheetMaster = DB::table('apex_data.timesheet_master')
            ->whereNotIn('category', ['Holiday'])
            ->where('hr_id', '<>', '9999')
            ->whereBetween('date', [$startDate, $endDate])
            ->when($hrId, function ($query) use ($hrId) {
                return $query->where('hr_id', $hrId);
            })
            ->get();

        // Merge timesheet_today and timesheet_master records
        $timesheets = isset($timesheetToday) ? $timesheetToday->merge($timesheetMaster) : $timesheetMaster;

        // Fetch breaksheet records for the date range        
        $breaksheetMaster = DB::table('apex_data.breaksheet_master')
        ->whereBetween('date', [$startDate, $endDate])
        ->where('nosync_deleted', 0)
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('hr_id', $hrId);
        })
        ->get();

        // Merge breaksheet records with timesheets
        $timesheets = isset($breaksheetMaster) ? $timesheets->merge($breaksheetMaster) : $timesheets;

        return response()->json($timesheets);
    }

    public function events(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $hrId = auth()->user()->employee->hr_id;

        // Fetch event records for the date range
        $events = Event::whereBetween('on_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->select('events.*')
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('events.hr_id', $hrId)
            ->leftJoin('wings_config.users', 'users.id', '=', 'events.created_by_user_id')
            ->addSelect('users.name as logged_by');
        })
        ->get();

        return response()->json($events);
    }

    public function calls(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $hrId = auth()->user()->employee->hr_id;

        $calls = DB::connection("apex_data")
        ->table("apex_data")
        ->whereBetween('date', [$startDate, $endDate])
        ->where(function($query){
            $query->where('apex_data.answered','=','1');
            $query->orWhere('apex_data.type','<>','Queue');
        })
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('hr_id', $hrId);
        })
        ->select('apex_data.hr_id', 'apex_data.date_time', 'apex_data.ddi', DB::raw('IF(apex_data.type <> "Queue", apex_data.ring_time + apex_data.calltime, apex_data.calltime) as time'))
        ->get();

        $callMonitoring = DB::table('call_monitoring.cm_log')
        ->leftJoin('wings_data.hr_details', 'cm_log.user_id', '=', 'hr_details.user_id')
        ->whereBetween('started_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('hr_details.hr_id', $hrId);
        })
        ->select('hr_details.hr_id', 'cm_log.started_at as date_time', DB::raw('TIMESTAMPDIFF(SECOND, cm_log.started_at, cm_log.ended_at) as time'))
        ->get();

        $calls = isset($callMonitoring) ? $calls->merge($callMonitoring) : $calls;

        return response()->json($calls);
    }

    public function users(Request $request){
        // Fetch all users with their HR details
        $users = User::where('client_ref', '=', 'ANGL')
            ->leftJoin('wings_data.hr_details', 'users.id', '=', 'hr_details.user_id')
            ->select('users.id', 'users.name', 'users.email', 'hr_details.profile_photo', 'hr_details.hr_id', 'hr_details.rank', 'hr_details.job_title')
            ->where('users.active', 1)
            ->groupBy('users.id')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($users, 200);
    }

    /**
     * Get payroll estimation for the current user
     * This provides a rough before-tax estimate based on hours worked and bonus
     */
    public function payrollEstimate(Request $request){
        $employee = auth()->user()->employee;
        $hrId = $employee->hr_id;
        
        // Get employee details
        $employeeDetails = Employee::where('hr_id', $hrId)->first();
        
        if (!$employeeDetails) {
            return response()->json([
                'error' => 'Employee not found',
            ], 404);
        }
        
        // Calculate current payroll period (29th of previous month to 28th of current month)
        $now = Carbon::now();
        $periodStart = $this->getPayrollPeriodStart($now);
        $periodEnd = $this->getPayrollPeriodEnd($now);
        
        // Get hours worked per day from timesheet_master for completed entries
        $dailyHoursMaster = DB::table('apex_data.timesheet_master')
            ->where('hr_id', $hrId)
            ->whereBetween('date', [$periodStart, $periodEnd])
            ->whereNotIn('category', ['Holiday', 'Break'])
            ->select('date', DB::raw('SUM(TIMESTAMPDIFF(MINUTE, on_time, off_time)) as minutes'))
            ->groupBy('date')
            ->get()
            ->keyBy('date');
        
        // Also get active timesheet entries from timesheet_today (hours per day)
        $dailyHoursToday = DB::table('apex_data.timesheet_today')
            ->where('hr_id', $hrId)
            ->whereBetween('date', [$periodStart, $periodEnd])
            ->whereNotIn('category', ['Holiday', 'Break'])
            ->select('date', DB::raw('SUM(TIMESTAMPDIFF(MINUTE, on_time, COALESCE(off_time, NOW()))) as minutes'))
            ->groupBy('date')
            ->get()
            ->keyBy('date');
        
        // Merge daily hours (combine master and today records)
        $dailyHours = [];
        $allDates = collect($dailyHoursMaster->keys())->merge($dailyHoursToday->keys())->unique();
        
        foreach ($allDates as $date) {
            $masterMinutes = $dailyHoursMaster->get($date)->minutes ?? 0;
            $todayMinutes = $dailyHoursToday->get($date)->minutes ?? 0;
            $totalMinutes = $masterMinutes + $todayMinutes;
            
            if ($totalMinutes > 0) {
                $dailyHours[$date] = round($totalMinutes / 60, 4);
            }
        }
        
        // Calculate total hours
        $totalHours = round(array_sum($dailyHours), 2);
        
        // Calculate bonus using PayrollController methods
        $payrollController = new PayrollController();
        $bonus = $payrollController->calculateBonusForUser(
            $hrId,
            $employeeDetails->halo_id,
            $periodStart,
            $periodEnd
        );
        
        // Add any adhoc bonuses for this period
        $adhocBonus = DB::connection('hr')
            ->table('exceptions')
            ->where('hr_id', $hrId)
            ->where('type', 'Adhoc Bonus')
            ->whereBetween('startdate', [$periodStart, $periodEnd])
            ->sum('amount');
        
        $bonus = round($bonus + $adhocBonus, 2);
        
        // Calculate next payday (closest working day to the 5th of month after period ends)
        $nextPayday = $this->calculatePayday($periodEnd);
        
        // If pay_rate is set, calculate base pay on the backend with fixed rate
        // Otherwise, return DOB and daily hours so frontend can calculate using minimum wage bands
        // (age may change mid-period, creating multiple pay bands)
        if ($employeeDetails->pay_rate) {
            $payRate = floatval($employeeDetails->pay_rate);
            $basePay = round($totalHours * $payRate, 2);
            
            return response()->json([
                'estimated_pay' => round($basePay + $bonus, 2),
                'hours_worked' => $totalHours,
                'hourly_rate' => $payRate,
                'bonus' => $bonus,
                'base_pay' => $basePay,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'next_payday' => $nextPayday,
                'use_minimum_wage' => false,
            ]);
        }
        
        // No fixed pay rate - return DOB and daily hours for frontend minimum wage calculation
        return response()->json([
            'hours_worked' => $totalHours,
            'daily_hours' => $dailyHours,
            'bonus' => $bonus,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'next_payday' => $nextPayday,
            'use_minimum_wage' => true,
            'date_of_birth' => $employeeDetails->dob,
        ]);
    }
    
    /**
     * Get the payroll period start date (29th of previous month)
     * For February in non-leap years, use 28th. For leap years, use 29th.
     */
    private function getPayrollPeriodStart(Carbon $date): string
    {
        // Period starts on 29th of the previous month
        $periodStart = $date->copy()->subMonth();
        
        // Handle months with less than 29 days (February)
        $lastDayOfMonth = $periodStart->copy()->endOfMonth()->day;
        $startDay = min(29, $lastDayOfMonth);
        
        return $periodStart->setDay($startDay)->format('Y-m-d');
    }
    
    /**
     * Get the payroll period end date (28th of current month)
     */
    private function getPayrollPeriodEnd(Carbon $date): string
    {
        // Period ends on 28th of current month
        $lastDayOfMonth = $date->copy()->endOfMonth()->day;
        $endDay = min(28, $lastDayOfMonth);
        
        return $date->copy()->setDay($endDay)->format('Y-m-d');
    }
    
    /**
     * Calculate the payday (closest working day to the 5th of the month after period ends)
     * Accounts for weekends and UK bank holidays (specifically early May bank holiday)
     */
    private function calculatePayday(string $periodEnd): string
    {
        $periodEndDate = Carbon::parse($periodEnd);
        
        // Payday is the 5th of the month after the period ends
        $payday = $periodEndDate->copy()->addMonth()->setDay(5);
        
        // UK Bank Holidays that fall on the 5th (Early May Bank Holiday can be 5th May)
        $bankHolidays = $this->getUKBankHolidaysAroundFifth($payday->year);
        
        // Find closest working day to the 5th
        $payday = $this->getClosestWorkingDay($payday, $bankHolidays);
        
        return $payday->format('Y-m-d');
    }
    
    /**
     * Get UK bank holidays that could affect the 5th of any month
     * Primary concern is Early May Bank Holiday (first Monday of May)
     */
    private function getUKBankHolidaysAroundFifth(int $year): array
    {
        $holidays = [];
        
        // Early May Bank Holiday (first Monday of May)
        $firstMondayOfMay = Carbon::create($year, 5, 1)->next(Carbon::MONDAY);
        if ($firstMondayOfMay->day > 7) {
            // If next Monday is past the 7th, the 1st was a Monday
            $firstMondayOfMay = Carbon::create($year, 5, 1);
        }
        $holidays[] = $firstMondayOfMay->format('Y-m-d');
        
        // New Year's Day (or substitute) - could affect early January paydays
        $newYearsDay = Carbon::create($year, 1, 1);
        if ($newYearsDay->isWeekend()) {
            $holidays[] = $newYearsDay->next(Carbon::MONDAY)->format('Y-m-d');
        } else {
            $holidays[] = $newYearsDay->format('Y-m-d');
        }
        
        return $holidays;
    }
    
    /**
     * Find the closest working day to the target date
     * If target is a weekend or bank holiday, move to closest weekday (prefer earlier)
     */
    private function getClosestWorkingDay(Carbon $target, array $bankHolidays): Carbon
    {
        $targetStr = $target->format('Y-m-d');
        
        // Check if target is already a working day
        if (!$target->isWeekend() && !in_array($targetStr, $bankHolidays)) {
            return $target;
        }
        
        // Find closest working day by checking before and after
        $before = $target->copy();
        $after = $target->copy();
        
        // Look backwards first (prefer paying early)
        for ($i = 1; $i <= 5; $i++) {
            $before->subDay();
            $beforeStr = $before->format('Y-m-d');
            if (!$before->isWeekend() && !in_array($beforeStr, $bankHolidays)) {
                return $before;
            }
        }
        
        // If nothing found before, look forwards
        for ($i = 1; $i <= 5; $i++) {
            $after->addDay();
            $afterStr = $after->format('Y-m-d');
            if (!$after->isWeekend() && !in_array($afterStr, $bankHolidays)) {
                return $after;
            }
        }
        
        // Fallback to original date
        return $target;
    }
    
    /**
     * Get payroll history for the current user (last 12 months)
     * Returns actual payroll data from gross_pay table
     */
    public function payrollHistory(Request $request)
    {
        $employee = auth()->user()->employee;
        $hrId = $employee->hr_id;
        
        // Calculate date range for last 12 months
        $twelveMonthsAgo = Carbon::now()->subMonths(12)->startOfMonth()->format('Y-m-d');
        
        // Get last 12 months of payroll data
        $payrollHistory = DB::connection('hr')
            ->table('gross_pay')
            ->where('hr_id', $hrId)
            ->where('enddate', '>=', $twelveMonthsAgo)
            ->orderBy('enddate', 'asc')
            ->get([
                'startdate',
                'enddate',
                'gross_pay_pre_sacrifice',
                'gross_pay_post_sacrifice',
                'taxible_gross_pay',
                'paye_tax',
                'employee_nic',
                'employer_nic',
                'employee_pension',
                'employer_pension',
                'student_loan',
                'ssp',
                'spp',
                'net_pay',
                'processed_date',
            ]);
        
        return response()->json([
            'history' => $payrollHistory,
        ]);
    }
}
