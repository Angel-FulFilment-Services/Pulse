<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\App\SiteController;

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

Route::post('/onsite/access/sign-in-or-out', [SiteController::class, 'signInOrOutByGUID'])
->withoutMiddleware('ipInRange')
->withoutMiddleware('guest')
->withoutMiddleware('throttle:api')
->middleware('throttle:100,1')
->middleware('auth:api');