<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employee\Employee;
use Inertia\Inertia;

class AccountController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth']);
        // $this->middleware(['perm.check:view_dashboard']);
    }

    public function index($page){
        $employee = Employee::find(auth()->user()->id);

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

    public function saveData(Request $request, $page){
        dd($request, $page);


        $employee = Employee::find(auth()->user()->id);
        $employee->update($request->all());
        return redirect()->back();
    }
}
