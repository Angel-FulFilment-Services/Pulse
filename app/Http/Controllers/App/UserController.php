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
        $this->middleware(['log.access', 'twofactor']);
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
}
