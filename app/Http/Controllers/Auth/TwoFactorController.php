<?php

namespace App\Http\Controllers\auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Helper\Permissions;
use App\Jobs\SendTwoFactorEmail;
use App\Jobs\SendTwoFactorSMS;

class TwoFactorController extends Controller
{
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['log.access']);
    }

    // Return the login view
    public function index()
    {
        return Inertia::render('Authentication/Verify');
    }
    
    public function verify(request $request)
    {
        try {
            if($request->input('passcode')){
                $request->validate([
                    'passcode' => ['required', 'alpha_num', 'size:6'],
                ]);  
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors(['error' => 'Please enter a valid passcode.'])->withInput();
        }

        $passcode = $request->input('passcode');

        $user = auth()->user();
        if ($passcode !== $user->pulse_two_factor_code) {
            return back()->withErrors(['error' => "The passcode you entered doesn't match our records"])->withInput();
        }
        $user->reset_two_factor_code();
        return redirect()->route('rota');
    }

    public function resend(){
        $sent_via_email = false;
        $sent_via_sms = false;

        auth()->user()->generate_two_factor_code();

        // Check if this user has 2FA by SMS activated, if so send a SMS notification with a 2FA code.
        if(Permissions::hasPermission('email_2fa_enabled')){
            $user = auth()->user();
            $email = preg_replace_callback(
                '/^(.)(.*?)([^@]?)(?=@[^@]+$)/u',
                function ($m) {
                    return $m[1]
                            . str_repeat("*", max(4, mb_strlen($m[2], 'UTF-8')))
                            . ($m[3] ?: $m[1]);
                },
                $user->email
            );
            SendTwoFactorEmail::dispatch(auth()->user());

            $sent_via_email = true;
        }

        // Check if this user has 2FA by SMS activated, if so send a SMS notification with a 2FA code.
        if(Permissions::hasPermission('sms_2fa_enabled')){
            SendTwoFactorSMS::dispatch(auth()->user());

            $sent_via_sms = true;
        }

        return back()->with('resent',("A new passcode has been sent to the " . ($sent_via_email ? "email " : null) . ($sent_via_email & $sent_via_sms ? " and " : null) . ($sent_via_sms ? "mobile number" : null) . " tied to this account."));
    }
}
