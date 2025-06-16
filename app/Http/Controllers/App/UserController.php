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
            ->select('hr_details.hr_id', 'hr_details.rank', 'hr_details.user_id', 'hr_details.profile_photo', 'tt.off_time', DB::raw('MAX(tt.on_time) as latest_on_time'), 'users.name', 'hr_details.job_title', 'hr_details.start_date')
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
                'rank' => $user->rank,
                'new' => Carbon::parse($user->start_date)->diffInDays(Carbon::now()) <= 30,
            ];
        }

        return response()->json($userStates);
    }

    public function users(Request $request){
        // Fetch all users with their HR details
        $users = User::where('client_ref', '=', 'ANGL')
            ->leftJoin('wings_data.hr_details', 'users.id', '=', 'hr_details.user_id')
            ->leftJoin('assets.asset_log', function($join) {
                $join->on('asset_log.user_id', '=', 'users.id')
                    ->where('asset_log.issued', '=', 1)
                    ->where('asset_log.returned', '=', 0);
            })
            ->select('users.id', 'users.name', 'users.email', 'hr_details.profile_photo', 'hr_details.hr_id', 'hr_details.rank', 'hr_details.job_title', 'asset_log.id as asset_log_id')
            ->where(function($query) {
                $query->where('users.active', '=', 1)
                    ->orWhereNotNull('asset_log.id');
            })
            ->groupBy('users.id')
            ->orderBy('name', 'asc')
            ->get();

            Log::debug($users->count() . ' users fetched from the database.');

        return response()->json($users, 200);
    }
}
