<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\App\RotaController;
use App\Http\Controllers\App\AccountController;
use App\Http\Controllers\App\UserController;

use App\Helper\T2SMS;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/rota/shifts', [RotaController::class, 'shifts'])
->withoutMiddleware('throttle:api')
->middleware('throttle:100,1');

Route::get('/rota/timesheets', [RotaController::class, 'timesheets'])
->withoutMiddleware('throttle:api')
->middleware('throttle:100,1');

Route::get('/users/active_states', [UserController::class, 'activeStates'])
->withoutMiddleware('throttle:api')
->middleware('throttle:100,1');

Route::post('/t2/send_sms', function (Request $request) {

    $validated = $request->validate([
        'from' => 'required|string',
        'to' => 'required|string',
        'message' => 'required|string',
    ]);

    Log::info($validated['from']);
    Log::info($validated['to']);
    Log::info($validated['message']);


    $response = T2SMS::sendSms($validated['from'], $validated['to'], $validated['message']);

    return response()->json(['status' => $response], 200);
})->withoutMiddleware('throttle:api')
->middleware('throttle:100,1');