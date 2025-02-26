<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\User\User;
use App\Models\Authentication\Invitation;
use Illuminate\Support\Facades\Hash;
use DateTime;
use Str;
use URL;

class LoginController extends Controller
{
    // Blocked logged in user from logging in
    public function __construct(){
        // $this->middleware(['guest']);
    }

    // Return the login view
    public function index()
    {
        return Inertia::render('Authentication/Login');
    }
    
    public function login(request $request)
    {
        // sleep(1);

        $this->validate($request, [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // sign in user
        if (!auth()->attempt(['email' => STR::lower($request->email), 'password' => $request->password, 'active' => 1],$request->remember)){                            
            if(User::where('active', 0)->where('email',STR::lower($request->email))->count()){
                return back()->withErrors(['error' => 'Please activate this account before logging in.']);
            }else{
                return back()->withErrors(['error' => 'You have entered an invalid username or password.']);
            }
        };
    }
}
