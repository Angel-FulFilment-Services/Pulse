<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiteController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['guest']);
        $this->middleware(['log.access']);
    }

    public function accessControl(){
        return Inertia::render('Site/Access');
    }
}
