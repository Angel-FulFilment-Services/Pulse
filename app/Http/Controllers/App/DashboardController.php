<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth']);
        // $this->middleware(['perm.check:view_dashboard']);
    }

    public function index(){
        return Inertia::render('Dashboard/Dashboard');
    }
}
