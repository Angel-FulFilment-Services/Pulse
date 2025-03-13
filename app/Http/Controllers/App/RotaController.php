<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Rota\Shift;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Log;

class RotaController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        // $this->middleware(['perm.check:view_dashboard']);
    }

    public function index(){
        return Inertia::render('Rota/Rota');
    }

    public function shifts(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Fetch shifts for the date range
        $shifts = Shift::whereBetween('shiftdate', [$startDate, $endDate])
        ->leftJoin("wings_data.hr_details", 'shifts.hr_id', '=', 'hr_details.hr_id')
        ->select("shifts.*", "hr_details.job_title")
        ->get();

        return response()->json($shifts);
    }

    public function timesheets(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Fetch timesheet_today records for the date range
        if((date('Y-m-d') >= $startDate) && (date('Y-m-d') <= $endDate)){
            $timesheetToday = DB::table('apex_data.timesheet_today')
                ->whereBetween('date', [$startDate, $endDate])
                ->get()
                ->map(function ($record) {
                    if (is_null($record->off_time)) {
                        $record->off_time = Carbon::now();
                    }
                    return $record;
                });
        }

        // Fetch timesheet_master records for the date range
        $timesheetMaster = DB::table('apex_data.timesheet_master')
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        // Merge timesheet_today and timesheet_master records
        $timesheets = isset($timesheetToday) ? $timesheetToday->merge($timesheetMaster) : $timesheetMaster;

        return response()->json($timesheets);
    }
}
