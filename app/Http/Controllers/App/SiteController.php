<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User\User;
use DB;
use Log;

class SiteController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['guest']);
        $this->middleware(['log.access']);
    }

    public function accessControl(){
        return Inertia::render('Site/Access');
    }

    public function employees(Request $request){
        // Fetch all employees with their HR details
        $employees = User::where('client_ref', '=', 'ANGL')
            ->leftJoin('wings_data.hr_details', 'users.id', '=', 'hr_details.user_id')
            ->select('users.id', 'users.name', 'users.qr_token', 'hr_details.profile_photo', 'hr_details.hr_id', 'hr_details.rank', 'hr_details.job_title', 'users.qr_token')
            ->groupBy('users.id')
            ->where('users.name', 'LIKE', '%'.$request->input('name', '').'%')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($employees, 200);
    }

    public function findUser(Request $request){
        // Fetch employee by GUID
        $signedIn = false;
        $employee = User::where('client_ref', '=', 'ANGL')
            ->where('users.qr_token', $request->input('guid'))
            ->value('id');
        
        if ($employee) {
            return response()->json($employee, 200);
        } else {
            return response()->json(['message' => 'Employee not found'], 404);
        }
    }

    public function isUserSignedIn($userId){
        // Check if user is signed in
        $status = DB::connection('wings_config')->table('site_access_log')->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->whereIn('type', ['access'])
            ->select(DB::raw('IF(signed_out IS NULL, true, false) as signed_in'))
            ->first();

        return $status ? $status->signed_in : false;
    }

    public function signInOrOut(Request $request){
        try {
            $employee = $request->input('user_id', null);
            $signedIn = $this->isUserSignedIn($employee);

            if (!$signedIn){
                DB::connection('wings_config')->table('site_access_log')->insert([
                    'type' => 'access',
                    'category' => 'employee',
                    'signed_in' => now(),
                    'location' => $request->input('location', null),
                    'user_id' => $request->input('user_id', null),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $action = 'sign-in';
            } else {
                DB::connection('wings_config')->table('site_access_log')->where('user_id', '=', $employee)->whereNull('signed_out')->orderBy('created_at', 'desc')->limit(1)->update([
                    'signed_out' => now(),
                    'updated_at' => now(),
                ]);
                $action = 'sign-out';
            }
            return response()->json(['message' => 'Signed in successfully', 'action' => $action], 200);
        } catch (\Throwable $th) {
            Log::debug('Error processing sign in/out', [
                'error' => $th->getMessage(),
                'user_id' => $request->input('user_id', null),
                'location' => $request->input('location', null),
            ]);
            return response()->json(['message' => 'Error processing sign in/out'], 500);         
        }
    }

    public function signIn(Request $request){
        DB::connection('wings_config')->table('site_access_log')->insert([
            'type' => $request->input('type', null),
            'category' => $request->input('category', null),
            'datetime' => now(),
            'location' => $request->input('location', null),
            'user_id' => $request->input('user_id', null),
            'visitor_name' => $request->input('visitor_name', null),
            'visitor_company' => $request->input('visitor_company', null),
            'visitor_visiting' => $request->input('visitor_visiting', null),
            'visitor_visiting_user_id' => $request->input('visitor_visiting_user_id', null),
            'visitor_car_registration' => $request->input('visitor_car_registration', null),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function signOut(Request $request){
        DB::connection('wings_config')->table('site_access_log')->insert([
            'type' => 'sign_out',
            'category' => $request->input('category', null),
            'datetime' => now(),
            'location' => $request->input('location', null),
            'user_id' => $request->input('user_id', null),
            'visitor_name' => $request->input('visitor_name', null),
            'visitor_company' => $request->input('visitor_company', null),
            'visitor_visiting' => $request->input('visitor_visiting', null),
            'visitor_visiting_user_id' => $request->input('visitor_visiting_user_id', null),
            'visitor_car_registration' => $request->input('visitor_car_registration', null),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Signed out successfully'], 200);
    }
}
