<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\App\SiteController;
use App\Http\Controllers\App\AssetController;

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

Route::post('/onsite/access/sign-in-or-out', [SiteController::class, 'signInOrOutByAuth'])
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