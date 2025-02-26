<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Rota\Shift;
use Schema;

class RotaController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        // $this->middleware(['auth']);
        // $this->middleware(['perm.check:view_dashboard']);
    }

    public function index(){
        return Inertia::render('Rota/Rota');
    }

    public function shifts(Request $request){

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $shifts = Shift::whereBetween('shiftdate', [$startDate, $endDate])->get();
        return response()->json($shifts);
    }
}
