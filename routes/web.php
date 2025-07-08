<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Auth
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\ForgotController;
use App\Http\Controllers\Auth\ActivationController;
use App\Http\Controllers\Auth\ResetController;
use App\Http\Controllers\Auth\TwoFactorController;

// App
use App\Http\Controllers\App\DashboardController;
use App\Http\Controllers\App\RotaController;
use App\Http\Controllers\App\ReportingController;
use App\Http\Controllers\App\AssetController;
use App\Http\Controllers\App\PayrollController;
use App\Http\Controllers\App\SiteController;

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
| Two Factor Authentication
|-----------------------
*/

Route::get('/verify', [TwoFactorController::class, 'index'])->name('verify');
Route::get('/verify/resend', [TwoFactorController::class, 'resend'])->name('resend');
Route::post('/verify', [TwoFactorController::class, 'verify']);

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
Route::get('/rota/shifts', [RotaController::class, 'shifts'])->withoutMiddleware('log.access');
Route::get('/rota/timesheets', [RotaController::class, 'timesheets'])->withoutMiddleware('log.access');
Route::get('/rota/events', [RotaController::class, 'events'])->withoutMiddleware('log.access');
Route::get('/rota/calls', [RotaController::class, 'calls'])->withoutMiddleware('log.access');
Route::post('/rota/save-event', [RotaController::class, 'saveEvent']);
Route::post('/rota/remove-event', [RotaController::class, 'removeEvent']);
Route::post('/rota/remove-break', [RotaController::class, 'removeBreak']);

/*
|-----------------------
| Reporting
|-----------------------
*/

Route::get('/reporting', [ReportingController::class, 'index'])->name('reporting');
Route::get('/reporting/{page}', [ReportingController::class, 'index'])->name('reporting');

Route::get('/reporting/reports/generate/attendance', [ReportingController::class, 'attendenceReport']);
Route::get('/reporting/reports/generate/hours-comparison', [ReportingController::class, 'hoursComparisonReport']);
Route::get('/reporting/reports/generate/event-log', [ReportingController::class, 'eventLog']);
Route::get('/reporting/reports/generate/technical-support-log', [ReportingController::class, 'technicalSupportLog']);
Route::get('/reporting/reports/generate/kit-details', [ReportingController::class, 'kitDetailsReport']);
Route::get('/reporting/reports/generate/sms-log', [ReportingController::class, 'smsLog']);
Route::get('/reporting/reports/generate/audit-log', [ReportingController::class, 'auditLog']);
Route::get('/reporting/reports/generate/access-log', [ReportingController::class, 'accessLog']);

Route::post('/reporting/reports/targets/set', [ReportingController::class, 'setTargets'])->withoutMiddleware('log.access');

Route::get('/reporting/targets/utilisation', [ReportingController::class, 'utilisationTargets'])->withoutMiddleware('has.permission:pulse_view_reporting', 'log.access');

/*
|-----------------------
| Payroll
|-----------------------
*/  

Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll');
Route::get('/payroll/{page}', [PayrollController::class, 'index'])->name('payroll');
Route::get('/payroll/exports/exceptions', [PayrollController::class, 'exceptions']);
Route::post('/payroll/exports/exceptions/save', [PayrollController::class, 'saveException']);
Route::post('/payroll/exports/exceptions/remove', [PayrollController::class, 'removeException']);
Route::get('/payroll/exports/generate/payroll', [PayrollController::class, 'payrollExport']);
Route::get('/payroll/export/payroll', [PayrollController::class, 'payrollExportSage']);
Route::post('/payroll/imports/gross-pay', [PayrollController::class, 'importGrossPay'])->withoutMiddleware('log.access');
Route::get('/payroll/imports/log', [PayrollController::class, 'importLog']);
Route::post('/payroll/exports/toggle-hold', [PayrollController::class, 'toggleHold'])->withoutMiddleware('log.access');

/*
|-----------------------
| Employee
|-----------------------
*/

// HR Details
Route::get('/my-details/entry/{page}', [AccountController::class, 'index'])->name('employee')->withoutMiddleware('has.permission:pulse_view_account');
Route::get('/my-details/entry/{page}/save', [AccountController::class, 'saveData'])->name('employee');
Route::get('/my-details', [AccountController::class, 'index'])->name('employee');
Route::get('/employee/information', [AccountController::class, 'information'])->withoutMiddleware('has.permission:pulse_view_account');

Route::get('/profile/account', [AccountController::class, 'profile'])->name('account.profile')->withoutMiddleware('has.permission:pulse_view_account');
Route::post('/profile/account/photo/set', [AccountController::class, 'setProfilePhoto'])->name('account.profile.photo.set')->withoutMiddleware('has.permission:pulse_view_account');
Route::post('/profile/account/photo/delete', [AccountController::class, 'deleteProfilePhoto'])->name('account.profile.photo.remove')->withoutMiddleware('has.permission:pulse_view_account');
Route::get('/profile/account/photo', [AccountController::class, 'photo'])->name('account.profile.photo')->withoutMiddleware('has.permission:pulse_view_account','auth','twofactor');

/*
|-----------------------
| User
|-----------------------
*/

Route::get('/users/active-states', [UserController::class, 'activeStates'])->withoutMiddleware('log.access');
Route::get('/users', [UserController::class, 'users'])->name('users');

/*
|-----------------------
| Asset Management
|-----------------------
*/

Route::get('/asset-management/support/events', [AssetController::class, 'events']);
Route::post('/asset-management/support/events/remove', [AssetController::class, 'remove']);
Route::post('/asset-management/support/events/save', [AssetController::class, 'saveSupportEvent']);
Route::post('/asset-management/support/events/resolved', [AssetController::class, 'resolved']);
Route::get('/asset-management/kit', [AssetController::class, 'kit']);
Route::get('/asset-management/kits', [AssetController::class, 'kits']);
Route::get('/asset-management/assets', [AssetController::class, 'assets']);
Route::get('/asset-management/assets/scan', [AssetController::class, 'scan']);
Route::get('/asset-management/assets/find', [AssetController::class, 'find']);
Route::get('/asset-management/assets/load', [AssetController::class, 'loadAsset']);
Route::post('/asset-management/assets/create', [AssetController::class, 'createAsset']);
Route::post('/asset-management/assets/pat-test/process', [AssetController::class, 'processPatTest']);
Route::post('/asset-management/assets/mark', [AssetController::class, 'markAsset']);
Route::get('/asset-management/kits/load', [AssetController::class, 'loadKit']);
Route::post('/asset-management/kits/assign', [AssetController::class, 'assignKit']);
Route::post('/asset-management/kits/unassign', [AssetController::class, 'unassignKit']);
Route::post('/asset-management/kits/item/remove', [AssetController::class, 'removeKitItem']);
Route::post('/asset-management/kits/item/add', [AssetController::class, 'addKitItem']);
Route::post('/asset-management/kits/returns/process', [AssetController::class, 'processEquipmentReturn']);

/*
|-----------------------
| OnSite
|-----------------------
*/

Route::get('/onsite/access-control', [SiteController::class, 'accessControl'])->name('onsite.access_control');
Route::get('/onsite/access-control/{location}', [SiteController::class, 'accessControl'])->name('onsite.access_control');
Route::get('/onsite/widgets/access-control', [SiteController::class, 'widget'])->name('onsite.widget')->withoutMiddleware('guest')->middleware('auth', 'twofactor', 'has.permission:pulse_view_access_control');
Route::get('/onsite/signed-in', [SiteController::class, 'signedIn'])->name('onsite.signed_in');
Route::get('/onsite/sign-in', [SiteController::class, 'signIn'])->name('onsite.sign_in');
Route::get('/onsite/sign-out', [SiteController::class, 'signOut'])->name('onsite.sign_out');
Route::get('/onsite/sign-in-out', [SiteController::class, 'signInOrOut'])->name('onsite.sign_in_out');
Route::get('/onsite/status', [SiteController::class, 'isUserSignedIn'])->name('onsite.status');
Route::get('/onsite/find-user', [SiteController::class, 'findUser'])->name('onsite.find_user');
Route::get('/onsite/has-profile-photo', [SiteController::class, 'hasProfilePhoto'])->name('onsite.has_profile_photo');
Route::post('/onsite/access-control/account/photo/set', [SiteController::class, 'setProfilePhoto'])->name('onsite.access_control.account.photo.set');
Route::get('/employees', [SiteController::class, 'employees'])->name('employees');

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
})->withoutMiddleware('log.access');