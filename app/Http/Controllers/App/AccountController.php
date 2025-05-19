<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employee\Employee;
use App\Models\User\User;
use Inertia\Inertia;

class AccountController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth']);
        $this->middleware(['has.permission:pulse_view_account']);
        $this->middleware(['log.access']);
    }

    public function profile(){
        $user = User::find(auth()->user()->id);
        $employee = Employee::where('user_id',auth()->user()->id)->first();

        return Inertia::render('Account/Profile', [
            'employee' => $employee,
            'user' => $user,
        ]);
    }

    public function index($page){
        $employee = Employee::where('user_id',auth()->user()->id)->first();

        switch ($page) {
            case 'medical-conditions':
                $page = 2;
                break;
            case 'next-of-kin':
                $page = 3;
                break;
            case 'your-bank-details':
                $page = 4;
                break;
            case 'tax-information':
                $page = 5;
                break;
            case 'student-loan-questionaire':
                    $page = 6;
                    break;
            default:
                $page = 1;
                break;
        }
        
        return Inertia::render('Account/AccountForm', [
            'employee' => $employee,
            'initialPage' => $page,
        ]);

        // if(!HR::find(auth()->user()->id)->only('complete')){
        // }else{
        //     return Inertia::render('HR/MyDetails');
        // }       
    }

    public function information(Request $request){
        $hrId = $request->query('hr_id');

        $employee = Employee::where('hr_id', $hrId)->leftJoin('wings_config.users', 'hr_details.user_id', '=', 'users.id')->first();

        return response()->json($employee);
    }

    public function saveData(Request $request, $page){
        $employee = Employee::find(auth()->user()->id);
        $employee->update($request->all());
        return redirect()->back();
    }

    public function profilePhoto(Request $request){
        $userId = $request->query('userId');
        $user = User::find($userId);

        return $user ? response()->json($user->profile_photo) : null ;
    }

    public function activateState(Request $request){
        $userId = $request->query('userId');
        $user = User::find($userId);

        return $user ? response()->json(1) : null ;
    }
}
