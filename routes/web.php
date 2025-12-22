<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

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
use App\Http\Controllers\App\KnowledgeBaseController;
use App\Http\Controllers\App\Chat\ChatController;
use App\Http\Controllers\App\AdministrationController;
use App\Http\Controllers\App\ProxyController;

// HR
use App\Http\Controllers\App\AccountController;
use App\Http\Controllers\App\UserController;


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
| Administration
|-----------------------
*/
Route::get('/administration', [AdministrationController::class, 'index'])->name('administration');

// Free Gifts routes (with permission)
Route::get('/administration/free-gifts/configurations', [AdministrationController::class, 'angelGiftConfigurations'])
    ->middleware(['has.permission:pulse_view_free_gifts'])
    ->name('administration.settings.angel_gift_configurations');

// Restricted Words API CRUD (with permission)
Route::get('/api/administration/restricted-words', [AdministrationController::class, 'restrictedWords'])
    ->middleware(['has.permission:pulse_manage_restricted_words'])
    ->name('administration.restricted_words.index');
Route::post('/api/administration/restricted-words', [AdministrationController::class, 'storeRestrictedWord'])
    ->middleware(['has.permission:pulse_manage_restricted_words'])
    ->name('administration.restricted_words.store');
Route::put('/api/administration/restricted-words/{id}', [AdministrationController::class, 'updateRestrictedWord'])
    ->middleware(['has.permission:pulse_manage_restricted_words'])
    ->name('administration.restricted_words.update');
Route::delete('/api/administration/restricted-words/{id}', [AdministrationController::class, 'destroyRestrictedWord'])
    ->middleware(['has.permission:pulse_manage_restricted_words'])
    ->name('administration.restricted_words.destroy');

// Wildcard route for SPA navigation (must come after specific routes)
Route::get('/administration/{page}', [AdministrationController::class, 'index'])->name('administration.page');


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
Route::post('/activate/token={token}', [ActivationController::class, 'activate']);
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
| Proxy (Camera Streams, etc)
|-----------------------
*/

Route::get('/proxy/3d-printer/camera', [ProxyController::class, 'cameraStream'])->name('proxy.camera');
Route::get('/proxy/3d-printer/status', [ProxyController::class, 'printerStatus'])->name('proxy.printer.status');
Route::get('/proxy/3d-printer/status-stream', [ProxyController::class, 'printerStatusStream'])->name('proxy.printer.status.stream');
Route::get('/proxy/bigin/pipeline-status', [ProxyController::class, 'biginPipelineStatus'])->name('proxy.bigin.pipeline.status')->withoutMiddleware('auth','twofactor', 'has.permission:pulse_view_administration');

/*
|-----------------------
| Dashboard
|-----------------------
*/

// Broadcasting authentication (needs to be accessible without twofactor)
Broadcast::routes(['middleware' => ['web', 'auth']]);

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::get('/', [DashboardController::class, 'index'])->middleware(['auth'])->name('dashboard');
Route::get('', [DashboardController::class, 'index'])->middleware(['auth'])->name('dashboard');
Route::get('/wallboard', [DashboardController::class, 'wallboard'])->name('wallboard');

/*
|-----------------------
| Rota
|-----------------------
*/

Route::get('/rota', [RotaController::class, 'index'])->name('rota');
Route::get('/rota/administration', [RotaController::class, 'index'])->name('rota');
Route::get('/rota/shifts', [RotaController::class, 'shifts'])->withoutMiddleware('log.access');
Route::get('/rota/timesheets', [RotaController::class, 'timesheets'])->withoutMiddleware('log.access');
Route::get('/rota/events', [RotaController::class, 'events'])->withoutMiddleware('log.access');
Route::get('/rota/calls', [RotaController::class, 'calls'])->withoutMiddleware('log.access');
Route::post('/rota/save-event', [RotaController::class, 'saveEvent']);
Route::post('/rota/remove-event', [RotaController::class, 'removeEvent']);
Route::post('/rota/remove-break', [RotaController::class, 'removeBreak']);

Route::get('/user/rota/shifts', [UserController::class, 'shifts'])->withoutMiddleware('log.access');
Route::get('/user/rota/timesheets', [UserController::class, 'timesheets'])->withoutMiddleware('log.access');
Route::get('/user/rota/events', [UserController::class, 'events'])->withoutMiddleware('log.access');
Route::get('/user/rota/calls', [UserController::class, 'calls'])->withoutMiddleware('log.access');

/*
|-----------------------
| Reporting
|-----------------------
*/

Route::get('/reporting', [ReportingController::class, 'index'])->name('reporting');
Route::get('/reporting/{page}', [ReportingController::class, 'index'])->name('reporting');

// Rota Reports
Route::get('/reporting/reports/generate/attendance', [ReportingController::class, 'attendenceReport'])
    ->middleware(['has.permission:pulse_report_rota']);
Route::get('/reporting/reports/generate/hours-comparison', [ReportingController::class, 'hoursComparisonReport'])
    ->middleware(['has.permission:pulse_report_rota']);
Route::get('/reporting/reports/generate/event-log', [ReportingController::class, 'eventLog'])
    ->middleware(['has.permission:pulse_report_rota']);

// Assets Reports
Route::get('/reporting/reports/generate/technical-support-log', [ReportingController::class, 'technicalSupportLog'])
    ->middleware(['has.permission:pulse_report_assets']);
Route::get('/reporting/reports/generate/kit-details', [ReportingController::class, 'kitDetailsReport'])
    ->middleware(['has.permission:pulse_report_assets']);

// System Reports
Route::get('/reporting/reports/generate/sms-log', [ReportingController::class, 'smsLog'])
    ->middleware(['has.permission:pulse_report_system']);
Route::get('/reporting/reports/generate/audit-log', [ReportingController::class, 'auditLog'])
    ->middleware(['has.permission:pulse_report_system']);
Route::get('/reporting/reports/generate/access-log', [ReportingController::class, 'accessLog'])
    ->middleware(['has.permission:pulse_report_system']);

// Site Reports
Route::get('/reporting/reports/generate/site-access-log', [ReportingController::class, 'siteAccessLog'])
    ->middleware(['has.permission:pulse_report_site']);

// Chat Audit Reports
Route::get('/reporting/reports/generate/chat-message-log', [ReportingController::class, 'chatMessageLog'])
    ->middleware(['has.permission:pulse_report_chat']);
Route::get('/reporting/reports/generate/chat-activity-summary', [ReportingController::class, 'chatActivitySummary'])
    ->middleware(['has.permission:pulse_report_chat']);
Route::get('/reporting/reports/generate/team-chat-activity', [ReportingController::class, 'teamChatActivity'])
    ->middleware(['has.permission:pulse_report_chat']);
Route::get('/reporting/reports/generate/dm-activity', [ReportingController::class, 'dmActivity'])
    ->middleware(['has.permission:pulse_report_chat']);
Route::get('/reporting/reports/generate/chat-attachment-log', [ReportingController::class, 'chatAttachmentLog'])
    ->middleware(['has.permission:pulse_report_chat']);
Route::get('/reporting/reports/generate/chat-forwarded-messages', [ReportingController::class, 'chatForwardedMessages'])
    ->middleware(['has.permission:pulse_report_chat']);
Route::get('/reporting/reports/generate/chat-deleted-messages', [ReportingController::class, 'chatDeletedMessages'])
    ->middleware(['has.permission:pulse_report_chat']);
Route::get('/reporting/reports/generate/chat-edited-messages', [ReportingController::class, 'chatEditedMessages'])
    ->middleware(['has.permission:pulse_report_chat']);
Route::get('/reporting/chat/attachment/{id}/download', [ReportingController::class, 'downloadChatAttachment'])
    ->middleware(['has.permission:pulse_report_chat']);

Route::post('/reporting/reports/targets/set', [ReportingController::class, 'setTargets'])->withoutMiddleware('log.access');

Route::get('/reporting/targets/utilisation', [ReportingController::class, 'utilisationTargets'])->withoutMiddleware('has.permission:pulse_view_reporting', 'log.access');


/*
|-----------------------
| Knowledge Base
|-----------------------
*/
Route::get('/knowledge-base', [KnowledgeBaseController::class, 'index'])->name('knowledge_base');
Route::get('/knowledge-base/technical-support', [KnowledgeBaseController::class, 'index'])->name('knowledge_base.technical_support');
Route::get('/knowledge-base/call-hub', [KnowledgeBaseController::class, 'index'])->name('knowledge_base.call_quality');
Route::get('/knowledge-base/call-hub/create-from-apex', [KnowledgeBaseController::class, 'createFromApex'])->name('knowledge_base.create_from_apex');
Route::get('/knowledge-base/articles', [KnowledgeBaseController::class, 'articles'])->name('knowledge_base.articles');
Route::post('/knowledge-base/create', [KnowledgeBaseController::class, 'create'])->name('knowledge_base.create');
Route::post('/knowledge-base/article/{id}/edit', [KnowledgeBaseController::class, 'update'])->name('knowledge_base.update');
Route::get('/knowledge-base/article/{id}', [KnowledgeBaseController::class, 'article'])->name('knowledge_base.article');
Route::get('/knowledge-base/article/{id}/edit', [KnowledgeBaseController::class, 'articleForEdit'])->name('knowledge_base.article_for_edit');
Route::delete('/knowledge-base/article/{id}', [KnowledgeBaseController::class, 'delete'])->name('knowledge_base.delete');
Route::get('/knowledge-base/resolution/{id}', [KnowledgeBaseController::class, 'resolution'])->name('knowledge_base.resolution');
Route::post('/knowledge-base/article/{id}/save-guide', [KnowledgeBaseController::class, 'saveGuide'])->name('knowledge_base.save_guide');
Route::post('/knowledge-base/upload-image', [KnowledgeBaseController::class, 'uploadImage'])->name('knowledge_base.upload_image');
Route::get('/knowledge-base/audio/{filename}', [KnowledgeBaseController::class, 'streamAudio'])->name('knowledge_base.audio.stream');

// Public routes (no auth required)
Route::get('/public/knowledge-base/article/{id}', [KnowledgeBaseController::class, 'publicArticle'])->name('knowledge_base.article.public');


/*
|-----------------------
| Chat
|-----------------------
*/
Route::get('/chat', [ChatController::class, 'index'])->name('chat');
Route::get('/chat/popout', [ChatController::class, 'popout'])->name('chat.popout');

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
| My Profile / HR
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
Route::get('/users/pulse/active-status', [UserController::class, 'pulseActiveStates']);
Route::get('/users', [UserController::class, 'users'])->name('users');

/*
|-----------------------
| Asset Management
|-----------------------
*/

Route::get('/asset-management', [AssetController::class, 'index'])->name('asset_management');
Route::get('/asset-management/support/events', [AssetController::class, 'events']);
Route::post('/asset-management/support/events/remove', [AssetController::class, 'remove']);
Route::post('/asset-management/support/events/save', [AssetController::class, 'saveSupportEvent']);
Route::post('/asset-management/support/events/resolved', [AssetController::class, 'resolved']);
Route::get('/asset-management/kit', [AssetController::class, 'kit'])->withoutMiddleware('has.permission:pulse_view_assets');
Route::get('/asset-management/kits', [AssetController::class, 'kits']);
Route::get('/asset-management/assets', [AssetController::class, 'assets']);
Route::get('/asset-management/assets/scan', [AssetController::class, 'scan']);
Route::get('/asset-management/assets/find', [AssetController::class, 'find']);
Route::get('/asset-management/assets/load', [AssetController::class, 'loadAsset']);
Route::post('/asset-management/assets/create', [AssetController::class, 'createAsset']);
Route::post('/asset-management/assets/pat-test/process', [AssetController::class, 'processPatTest']);
Route::post('/asset-management/assets/mark', [AssetController::class, 'markAsset']);
Route::post('/asset-management/kits/mark', [AssetController::class, 'markKit']);
Route::get('/asset-management/kits/load', [AssetController::class, 'loadKit']);
Route::post('/asset-management/kits/assign', [AssetController::class, 'assignKit']);
Route::post('/asset-management/assets/batch-import/preview', [AssetController::class, 'batchImportPreview']);
Route::post('/asset-management/assets/batch-import', [AssetController::class, 'batchImport']);
Route::post('/asset-management/kits/unassign', [AssetController::class, 'unassignKit']);
Route::post('/asset-management/kits/item/remove', [AssetController::class, 'removeKitItem']);
Route::post('/asset-management/kits/item/add', [AssetController::class, 'addKitItem']);
Route::post('/asset-management/kits/returns/process', [AssetController::class, 'processEquipmentReturn']);
Route::get('/asset-management/kits/assignable-users', [AssetController::class, 'assignable_users']);

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
Route::get('/onsite/status', [SiteController::class, 'isUserSignedInByRequest'])->name('onsite.status');
Route::get('/onsite/find-user', [SiteController::class, 'findUser'])->name('onsite.find_user');
Route::get('/onsite/has-profile-photo', [SiteController::class, 'hasProfilePhoto'])->name('onsite.has_profile_photo');
Route::post('/onsite/access-control/account/photo/set', [SiteController::class, 'setProfilePhoto'])->name('onsite.access_control.account.photo.set');
Route::get('/employees', [SiteController::class, 'employees'])->name('employees');

// Camera streaming routes
Route::get('/camera/viewer', [SiteController::class, 'cameraViewer'])->name('camera.viewer');

/*
|-----------------------
| Fire Emergency / Roll Call
|-----------------------
*/

// Fire roll call page (accessed via signed URL from email/SMS)
Route::get('/fire-emergency/roll-call', [SiteController::class, 'rollCall'])
    ->name('fire.roll-call')
    ->middleware(['signed']);