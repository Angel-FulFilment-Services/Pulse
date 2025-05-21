<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LogoutController extends Controller
{
    //
    public function __construct(){
        $this->middleware(['auth']);
        $this->middleware(['log.access']);
    }

    public function logout()
    {
        // Log out the user.
        auth()->logout();

        return redirect()->route('login');
    }
}
