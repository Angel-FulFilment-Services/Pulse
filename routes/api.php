<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\App\SiteController;
use App\Http\Controllers\App\AssetController;
use App\Http\Controllers\App\Chat\TeamController;
use App\Http\Controllers\App\Chat\MessageController;
use App\Http\Controllers\App\Chat\MessageReadController;
use App\Http\Controllers\App\Chat\AttachmentController;
use App\Http\Controllers\App\Chat\ChatFavoriteController;
use App\Http\Controllers\App\Chat\ChatPreferencesController;
use App\Http\Controllers\App\CallRecordingController;
use App\Http\Controllers\App\SystemController;
use App\Http\Controllers\App\ReportingController;

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

Route::get('/onsite/access', [SiteController::class, 'access'])->name('onsite.access');

Route::get('/onsite/access', [SiteController::class, 'access'])->name('onsite.access')
->middleware('auth')
->withoutMiddleware('ipInRange')
->withoutMiddleware('guest')
->withoutMiddleware('throttle:api')
->middleware('throttle:100,1');

Route::post('/onsite/access/sign-in-or-out', [SiteController::class, 'signInOrOutByAuth'])
->withoutMiddleware('ipInRange')
->withoutMiddleware('guest')
->withoutMiddleware('throttle:api')
->middleware('throttle:100,1')
->middleware('auth:api');

Route::post('/onsite/access/sign-in', [SiteController::class, 'signInByAuth'])
->withoutMiddleware('ipInRange')
->withoutMiddleware('guest')
->withoutMiddleware('throttle:api')
->middleware('throttle:100,1')
->middleware('auth:api');

Route::post('/onsite/access/sign-out', [SiteController::class, 'signOutByAuth'])
->withoutMiddleware('ipInRange')
->withoutMiddleware('guest')
->withoutMiddleware('throttle:api')
->middleware('throttle:100,1')
->middleware('auth:api');

Route::post('/asset-management/kits/status', [AssetController::class, 'isKitActive'])
->withoutMiddleware('auth')
->withoutMiddleware('twofactor')
->withoutMiddleware('has.permission:pulse_view_assets')
->middleware('throttle:100,1');

Route::get('/system/clients', [SystemController::class, 'clients'])
->withoutMiddleware('throttle:api')
->middleware('throttle:250,1')
->middleware('auth:api');


Route::get('/reporting/wallboard-statistics', [ReportingController::class, 'totalCPASignUps'])
->withoutMiddleware('throttle:api')
->middleware('throttle:250,1')
->withoutMiddleware('auth')
->withoutMiddleware('twofactor')
->withoutMiddleware('has.permission:pulse_view_reporting');

/*
|-----------------------
| T2 SMS Handler
|-----------------------
*/

Route::post('/t2/send_sms', function (Request $request) {
    $apiKey = $request->header('X-API-Key') ?? $request->input('api_key');
    $validApiKey = env('VITE_T2_API_KEY');

    if ($apiKey !== $validApiKey) {
        return response()->json(['error' => 'Invalid API key'], 401);
    }

    $validated = $request->validate([
        'from' => 'required|string',
        'to' => 'required|string',
        'message' => 'required|string',
    ]);

    $response = T2SMS::sendSms($validated['from'], $validated['to'], $validated['message']);

    return response()->json(['status' => $response], 200);
})->withoutMiddleware('log.access');

/*
|-----------------------
| Camera Streaming API - PeerJS Signaling
|-----------------------
*/

// QR Scanner stores its peer ID for viewers to find
Route::post('/camera/stream-offer', [SiteController::class, 'handleStreamOffer'])
->withoutMiddleware('log.access')
->withoutMiddleware('guest')
->middleware('throttle:100,1');

// Camera Viewer gets QR Scanner's peer ID
Route::get('/camera/get-stream-offer', [SiteController::class, 'getStreamOffer'])
->withoutMiddleware('log.access')
->withoutMiddleware('guest')
->middleware('throttle:100,1');

// Clear stored peer IDs when needed
Route::post('/camera/clear-offers', [SiteController::class, 'clearCameraOffers'])
->withoutMiddleware('log.access')
->withoutMiddleware('guest')
->middleware('throttle:100,1');

/*
|-----------------------
| Chat API Routes
|-----------------------
*/

Route::prefix('chat')->group(function () {    
    // Messages
    Route::get('messages', [MessageController::class, 'index']);
    Route::post('messages', [MessageController::class, 'store']);
    Route::put('messages/{id}', [MessageController::class, 'update']);
    Route::delete('messages/{id}', [MessageController::class, 'destroy']);
    Route::post('messages/{id}/restore', [MessageController::class, 'restore']);
    Route::get('messages/search', [MessageController::class, 'search']);
    Route::get('messages/pinned', [MessageController::class, 'getPinned']);
    Route::post('messages/{messageId}/pin', [MessageController::class, 'pin']);
    Route::delete('messages/{messageId}/pin', [MessageController::class, 'unpin']);
    Route::get('contacts', [MessageController::class, 'contacts']);
    Route::get('check-conversation', [MessageController::class, 'checkConversation']);
    Route::post('messages/{recipientId}/typing', [MessageController::class, 'typing']);
    Route::post('messages/{messageId}/reactions', [MessageController::class, 'addReaction']);
    Route::delete('messages/{messageId}/reactions', [MessageController::class, 'removeReaction']);
    
    // Attachment Reactions
    Route::post('attachments/{attachmentId}/reactions', [MessageController::class, 'addAttachmentReaction']);
    Route::delete('attachments/{attachmentId}/reactions', [MessageController::class, 'removeAttachmentReaction']);
    
    // Attachment Actions
    Route::post('attachments/{attachmentId}/pin', [MessageController::class, 'pinAttachment']);
    Route::delete('attachments/{attachmentId}/pin', [MessageController::class, 'unpinAttachment']);
    Route::delete('attachments/{attachmentId}', [MessageController::class, 'deleteAttachment']);
    Route::post('attachments/{attachmentId}/restore', [MessageController::class, 'restoreAttachment']);
    
    // Forwarding
    Route::post('messages/{messageId}/forward', [MessageController::class, 'forwardMessage']);
    Route::post('attachments/{attachmentId}/forward', [MessageController::class, 'forwardAttachment']);
    
    // Message Read Status
    Route::post('messages/read', [MessageReadController::class, 'store']);
    Route::post('messages/read-batch', [MessageReadController::class, 'storeBatch']);
    
    // Attachments
    Route::post('attachments/upload', [AttachmentController::class, 'upload']);
    Route::post('attachments/attach', [AttachmentController::class, 'attachToMessage']);
    Route::get('attachments/{id}/proxy', [AttachmentController::class, 'proxy'])->name('chat.attachments.proxy');
    Route::get('attachments/{id}/download', [AttachmentController::class, 'download']);
    Route::delete('attachments/{id}', [AttachmentController::class, 'delete']);
    
    // Teams
    Route::get('teams', [TeamController::class, 'index']);
    Route::post('teams', [TeamController::class, 'store']);
    Route::get('teams/search', [TeamController::class, 'search']);
    Route::get('teams/{teamId}', [TeamController::class, 'show']);
    Route::put('teams/{teamId}', [TeamController::class, 'update']);
    Route::delete('teams/{teamId}', [TeamController::class, 'destroy']);
    Route::post('teams/{teamId}/members', [TeamController::class, 'addMember']);
    Route::delete('teams/{teamId}/members/{userId}', [TeamController::class, 'removeMember']);
    Route::put('teams/{teamId}/members/{userId}/role', [TeamController::class, 'updateMemberRole']);
    Route::post('teams/{teamId}/mark-read', [TeamController::class, 'markRead']);
    Route::post('teams/{teamId}/typing', [TeamController::class, 'typing']);
    Route::post('teams/{teamId}/leave', [TeamController::class, 'leave']);
    Route::get('users/all', [TeamController::class, 'allUsers']);
    Route::get('users', [TeamController::class, 'users']);
    Route::get('users/{userId}/shift', [TeamController::class, 'getUserShift']);
    
    // Favorites
    Route::get('favorites', [ChatFavoriteController::class, 'index']);
    Route::post('favorites', [ChatFavoriteController::class, 'store']);
    Route::delete('favorites/{id}', [ChatFavoriteController::class, 'destroy']);
    Route::post('favorites/reorder', [ChatFavoriteController::class, 'reorder']);
    
    // Preferences
    Route::get('preferences', [ChatPreferencesController::class, 'get']);
    Route::post('preferences', [ChatPreferencesController::class, 'update']);
    Route::get('preferences/chat', [ChatPreferencesController::class, 'getChatPreferences']);
    Route::post('preferences/mark-unread', [ChatPreferencesController::class, 'markUnread']);
    Route::post('preferences/mark-read', [ChatPreferencesController::class, 'markRead']);
    Route::post('preferences/hide', [ChatPreferencesController::class, 'hide']);
    Route::post('preferences/unhide', [ChatPreferencesController::class, 'unhide']);
    Route::post('preferences/toggle-mute', [ChatPreferencesController::class, 'toggleMute']);
    Route::post('preferences/mute', [ChatPreferencesController::class, 'mute']);
    Route::post('preferences/unmute', [ChatPreferencesController::class, 'unmute']);
    Route::post('preferences/remove-history', [ChatPreferencesController::class, 'removeHistory']);
    Route::get('preferences/global', [ChatPreferencesController::class, 'getGlobalSettings']);
    Route::post('preferences/global', [ChatPreferencesController::class, 'updateGlobalSettings']);
    Route::post('preferences/hide-preview', [ChatPreferencesController::class, 'setHidePreview']);
    
    // Restricted Words
    Route::get('restricted-words', function () {
        return response()->json([
            'words' => \App\Models\RestrictedWord::getActiveWords()
        ]);
    });
});



/*
|-----------------------
| Fire Emergency / Roll Call
|-----------------------
*/

// Trigger fire emergency alert (accessible from both authenticated and access control)
Route::post('/fire-emergency/trigger', [SiteController::class, 'triggerFireEmergency'])
->withoutMiddleware('throttle:api')
->middleware('throttle:10,1'); // Limited to 10 requests per minute to prevent spam

// Check for active fire events (accessible from access control screens)
Route::get('/fire-emergency/check-active', [SiteController::class, 'checkActiveFireEvent']);