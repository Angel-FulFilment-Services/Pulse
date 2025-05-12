<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Auth
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\ForgotController;
use App\Http\Controllers\Auth\ActivationController;
use App\Http\Controllers\Auth\ResetController;

// App
use App\Http\Controllers\App\DashboardController;
use App\Http\Controllers\App\RotaController;
use App\Http\Controllers\App\ReportingController;

// HR
use App\Http\Controllers\App\AccountController;
use App\Http\Controllers\App\UserController;

use App\Helper\T2SMS;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

/*
|-----------------------
| Authorisation
|-----------------------
*/

// Login
Route::get('/login', [LoginController::class, 'index'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
// Logout
Route::post('/logout', [LogoutController::class, 'logout'])->name('logout');
// Activation
Route::get('/activate/token={token}', [ActivationController::class, 'index'])->name('activate')->middleware('signed');
Route::post('/activate/token={token}', [ActivationController::class, 'activate'])->name('activate');
// // Forgot Password
Route::get('/forgot', [ForgotController::class, 'index'])->name('forgot');
Route::post('/forgot', [ForgotController::class, 'password_reset'])->name('password_reset');
// // Reset Password
Route::get('/reset', [ResetController::class, 'index'])->name('reset')->middleware('signed');;
Route::post('/reset', [ResetController::class, 'reset_password'])->name('reset_password');

/*
|-----------------------
| Dashboard
|-----------------------
*/

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
// Route::get('/', [DashboardController::class, 'index'])->middleware(['auth'])->name('dashboard');

/*
|-----------------------
| Rota
|-----------------------
*/

Route::get('', [RotaController::class, 'index'])->name('rota');
Route::get('/', [RotaController::class, 'index'])->name('rota');
Route::get('/rota', [RotaController::class, 'index'])->name('rota');
Route::get('/rota/administration', [RotaController::class, 'index'])->name('rota');
Route::get('/rota/shifts', [RotaController::class, 'shifts']);
Route::get('/rota/timesheets', [RotaController::class, 'timesheets']);
Route::get('/rota/events', [RotaController::class, 'events']);
Route::get('/rota/calls', [RotaController::class, 'calls']);
Route::post('/rota/save-event', [RotaController::class, 'saveEvent']);
Route::post('/rota/remove-event', [RotaController::class, 'removeEvent']);
Route::post('/rota/remove-break', [RotaController::class, 'removeBreak']);

/*
|-----------------------
| Reporting
|-----------------------
*/

Route::get('/reporting', [ReportingController::class, 'index'])->name('reporting');

Route::get('/reporting/reports/generate/attendance', [ReportingController::class, 'attendenceReport']);
Route::get('/reporting/reports/generate/hours-comparison', [ReportingController::class, 'hoursComparisonReport']);

Route::post('/reporting/reports/targets/set', [ReportingController::class, 'setTargets']);

Route::get('/reporting/targets/utilisation', [ReportingController::class, 'utilisationTargets'])->withoutMiddleware('has.permission:pulse_view_reporting');

/*
|-----------------------
| Employee
|-----------------------
*/

// HR Details
Route::get('/my-details/entry/{page}', [AccountController::class, 'index'])->name('employee');
Route::get('/my-details/entry/{page}/save', [AccountController::class, 'saveData'])->name('employee');
Route::get('/my-details', [AccountController::class, 'index'])->name('employee');
Route::get('/employee/information', [AccountController::class, 'information'])->withoutMiddleware('has.permission:pulse_view_account');

/*
|-----------------------
| User
|-----------------------
*/

Route::get('/users/active-states', [UserController::class, 'activeStates']);

/*
|-----------------------
| T2 SMS Handler
|-----------------------
*/

Route::post('/t2/send_sms', function (Request $request) {

    $validated = $request->validate([
        'from' => 'required|string',
        'to' => 'required|string',
        'message' => 'required|string',
    ]);

    $response = T2SMS::sendSms($validated['from'], $validated['to'], $validated['message']);

    return response()->json(['status' => $response], 200);
});