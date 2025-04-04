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

//Dashboard
Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth'])->name('dashboard');
Route::get('/', [DashboardController::class, 'index'])->middleware(['auth'])->name('dashboard');

/*
|-----------------------
| Rota
|-----------------------
*/

//Dashboard
Route::get('/rota', [RotaController::class, 'index'])->middleware(['auth'])->name('rota');
Route::get('/rota/administration', [RotaController::class, 'index'])->middleware(['auth'])->name('rota');
Route::get('/rota/shifts', [RotaController::class, 'shifts']);
Route::get('/rota/timesheets', [RotaController::class, 'timesheets']);
Route::get('/rota/events', [RotaController::class, 'events']);
Route::post('/rota/save-event', [RotaController::class, 'saveEvent']);
Route::post('/rota/remove-event', [RotaController::class, 'removeEvent']);

/*
|-----------------------
| Employee
|-----------------------
*/

// HR Details
Route::get('/my-details/entry/{page}', [AccountController::class, 'index'])->middleware(['auth'])->name('employee');
Route::get('/my-details/entry/{page}/save', [AccountController::class, 'saveData'])->middleware(['auth'])->name('employee');
Route::get('/my-details', [AccountController::class, 'index'])->middleware(['auth'])->name('employee');

Route::get('/users/active-states', [UserController::class, 'activeStates']);

Route::post('/t2/send_sms', function (Request $request) {

    $validated = $request->validate([
        'from' => 'required|string',
        'to' => 'required|string',
        'message' => 'required|string',
    ]);

    $response = T2SMS::sendSms($validated['from'], $validated['to'], $validated['message']);

    return response()->json(['status' => $response], 200);
});