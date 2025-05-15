<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Asset\Event;

class AssetController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth']);
        $this->middleware(['has.permission:pulse_view_assets']);
    }

    public function index(){
        return Inertia::render('Dashboard/Dashboard');
    }

    public function events(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $hrId = $request->query('hr_id');

        // Fetch event records for the date range
        $events = Event::whereBetween('on_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->select('support_log.*')
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('support_log.hr_id', $hrId)
            ->leftJoin('wings_config.users', 'users.id', '=', 'support_log.created_by_user_id')
            ->addSelect('users.name as logged_by');
        })
        ->get();

        return response()->json($events);
    }
}
