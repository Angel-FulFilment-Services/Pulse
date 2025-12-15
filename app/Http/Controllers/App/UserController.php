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
use App\Models\User\UserStatus;

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
}
