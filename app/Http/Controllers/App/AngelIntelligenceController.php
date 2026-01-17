<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;


class AngelIntelligenceController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['has.permission:pulse_view_administration']);
        $this->middleware(['log.access']);
    }

    public function index(){
        return Inertia::render('AngelIntelligence/AngelIntelligence');
    }
}
