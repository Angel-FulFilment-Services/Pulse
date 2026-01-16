<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        if (!$request->expectsJson()) {
            // Store intended URL
            if (!session()->has('url.intended')) {
                session(['url.intended' => $request->fullUrl()]);
            }
            return route('login');
        }
        return null;
    }
}
