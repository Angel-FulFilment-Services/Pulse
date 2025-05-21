<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\User\User;
use App\Models\Authentication\Invitation;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ActivationController extends Controller
{
    // Blocked logged in user from registering
    public function __construct(){
        $this->middleware(['guest']);
        $this->middleware(['log.access']);
    }

    // Return the registation view
    public function index(Request $request)
    {
        $invitation = Invitation::find($request->token);

        if($invitation){
            return Inertia::render('Authentication/Activate', [
                'token' => $request->token
            ]);
        }else{
            return Inertia::render('Authentication/Login');
        };
    }
    

    public function activate(Request $request)
    {
        $rules = [
            'password' => [
                'required',
                'string',
                Password::min( 8 )->mixedCase()->numbers()->symbols()->uncompromised(),
                'confirmed'
            ],
        ];

        // Validate the chosen password.
        $this->validate($request, $rules);
                
        // Find the invitation
        $invitation = Invitation::find($request->token);

        // Update the user.
        User::where('email',$invitation->email)->update([
            'password' => hash::make($request->password),
            'active' => 1,
        ]);   

        // Remove the invitation token
        $invitation->delete();
    }

}
