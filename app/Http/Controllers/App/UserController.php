<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User\User;
use App\Models\Employee\Employee;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Log;

class UserController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        // $this->middleware(['auth']);
        // $this->middleware(['perm.check:view_dashboard']);
    }

    public function activeStates(Request $request){
        // Fetch employees with their latest timesheet record
        $users = Employee::leftJoin('apex_data.timesheet_today as tt', 'hr_details.hr_id', '=', 'tt.hr_id')
            ->select('hr_details.hr_id', 'hr_details.user_id', 'hr_details.profile_photo', 'tt.off_time', DB::raw('MAX(tt.on_time) as latest_on_time'))
            ->groupBy('hr_details.hr_id', 'hr_details.profile_photo', 'tt.off_time')
            ->get();

        $userStates = [];

        foreach ($users as $user) {
            $lastActiveAt = null;

            if ($user->latest_on_time) {
                $lastActiveAt = $user->off_time ? $user->off_time : Carbon::now();
            }

            $userStates[$user->hr_id] = [
                'profile_photo' => $user->profile_photo,
                'last_active_at' => $lastActiveAt,
            ];
        }

        return response()->json($userStates);
    }
}
