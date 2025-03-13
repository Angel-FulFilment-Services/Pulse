<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\App\RotaController;
use App\Http\Controllers\App\AccountController;
use App\Http\Controllers\App\UserController;

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