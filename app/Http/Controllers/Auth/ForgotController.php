<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User\User;
use App\Models\Authentication\PasswordReset;
use App\Notifications\PasswordResetNotification;
use Notification;
use Log;
use Str;
use URL;


class ForgotController extends Controller
{   

    // Block logged in user from resetting password
    public function __construct(){
        $this->middleware(['guest']);
        $this->middleware(['log.access']);
    }

    // Return the forgotten password view.
    public function index()
    {
        return Inertia::render('Authentication/Forgot');
    }

    // Return the reset sent view.
    public function reset_sent(){
        return view('auth.reset_sent');
    }

    // Send password reset email.
    public function password_reset(Request $request){

        // Validate email is provide and in correct format
        $this->validate($request, [
        'email' => 'required|email',
        ]);
        
        // Check if this email connects to a user.
        if(User::where('email',STR::lower($request->email))->count()){
            //return response('User found');
            $this->send_password_reset_email(STR::lower($request->email));
        }

        // Redirect the user to the reset sent page.
    }

    // Send password reset email.
    public function send_password_reset_email($email)
    {
        // Find any previous password reset emails, and invalidate.
        $password_reset = PasswordReset::where('email', $email);
        if($password_reset){
            $password_reset->delete();
        }

        // Create unique password reset token
        do {
            $token = Uuid::uuid4()->toString();
        } while (PasswordReset::where('token', $token)->first());

        // Create a new password reset record
        PasswordReset::create([
            'token' => $token,
            'email' => $email,
        ]);
           
        // Create tempoarary signed URL and send email notification
            $url = URL::temporarySignedRoute(
    
            'reset', now()->addHours(24), ['token' => $token]

        );

        Notification::route('mail', $email)->notify(new PasswordResetNotification($url));
    }
}
