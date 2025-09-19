<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\App\SiteController;
use App\Http\Controllers\App\AssetController;

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