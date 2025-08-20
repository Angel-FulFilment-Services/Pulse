<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\User\User;
use App\Helper\Permissions;
use App\Models\Authentication\Invitation;
use Illuminate\Support\Facades\Hash;
use App\Jobs\SendTwoFactorEmail;
use App\Jobs\SendTwoFactorSMS;
use App\Helper\T2SMS;
use DateTime;
use Str;
use URL;

class LoginController extends Controller
{
    // Blocked logged in user from logging in
    public function __construct(){
        $this->middleware(['guest']);
        $this->middleware(['log.access']);
    }

    // Return the login view
    public function index()
    {
        return Inertia::render('Authentication/Login');
    }
    
    public function login(request $request)
    {
        $this->validate($request, [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // Check if the user has permission to access Pulse
        $user = User::where('email', STR::lower($request->email))->first();
        if($user){
            if (!$user->hasPermission('pulse_allow_access')) {
                return back()->withErrors(['error' => 'You do not have permission to access this application.']);
            }

            if ($user->active == -3) {
                return back()->withErrors(['error' => 'Your account has been locked due to too many failed login attempts. Please contact support.']);
            }
    
            if ($user->login_attempt >= 5) {
                // Reset login_attempt and lock the account
                $user->update([
                    'login_attempt' => 0,
                    'active' => -3
                ]);
    
                return back()->withErrors(['error' => 'Your account has been locked due to too many failed login attempts. Please contact support.']);
            }
        }

        // sign in user
        if (!auth()->attempt(['email' => STR::lower($request->email), 'password' => $request->password, 'active' => 1],$request->remember)){                            
            if ($user) {
                // Increment the login_attempt counter
                $user->increment('login_attempt');

                // Check if the user is inactive
                if ($user->active == 0) {
                    return back()->withErrors(['error' => 'Please activate this account before logging in.']);
                }
            }

            return back()->withErrors(['error' => 'Invalid login details.']);
        };

        $user->update(['login_attempt' => 0]);

        if (!(ip2long($request->ip()) >= 3232235520 && ip2long($request->ip()) <= 3232301055) && app()->environment(['production', 'staging'])) {
            if (Permissions::hasPermission('sms_2fa_enabled') || Permissions::hasPermission('email_2fa_enabled')) {
                auth()->user()->generate_two_factor_code();
            }

            // Send 2FA SMS if enabled
            if (Permissions::hasPermission('sms_2fa_enabled')) {
                SendTwoFactorSMS::dispatch(auth()->user())->onQueue('pulse');
            }

            // Send 2FA email if enabled
            if (Permissions::hasPermission('email_2fa_enabled')) {
                SendTwoFactorEmail::dispatch(auth()->user())->onQueue('pulse');
            }
        }

        if(Permissions::hasPermission('pulse_view_rota')){
            return redirect()->intended('/rota'); // '/' is your fallback
        } else {
            return redirect()->intended('/'); // '/' is your fallback
        }
    }
}
