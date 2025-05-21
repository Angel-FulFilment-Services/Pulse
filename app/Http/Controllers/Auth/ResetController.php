<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User\User;
use App\Models\Authentication\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;


class ResetController extends Controller
{
    // Block logged in user from resetting password
    public function __construct(){
        $this->middleware(['guest']);
        $this->middleware(['log.access']);
    }

    // Return the reset password view.
    public function index(Request $request)
    {
        if(PasswordReset::find($request->token)){
            Inertia::render('Authentication/Reset', [
                'token' => $request->token
            ]);
        }else{
            abort(403);
        };
    }

    public function reset_password(Request $request){
        // Validate the chosen password.
        $this->validate($request, [
            'password' => [
                'required',
                'string',
                Password::min( 8 )->mixedCase()->numbers()->symbols()->uncompromised(),
                'confirmed'
            ],
        ]);
                
        // Find the invitation
        $password_reset = PasswordReset::find($request->token);

        // Update the user.
        User::where('email',$password_reset->email)->update([
            'password' => hash::make($request->password),
        ]);

        // Remove the invitation token
        $password_reset->delete();

        // redirect
        return redirect()->route('login');
    }
        
}
