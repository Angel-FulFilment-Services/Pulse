<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClearOldCookies
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // Clear old session cookies set on .angelfs.co.uk domain ONLY
        // These are the conflicting cookies from when SESSION_DOMAIN was shared
        $response->headers->setCookie(cookie()->forget('pulse_angel_charity_services_session', '/', '.angelfs.co.uk'));
        $response->headers->setCookie(cookie()->forget('wings_angel_charity_services_session', '/', '.angelfs.co.uk'));
        $response->headers->setCookie(cookie()->forget('pulse_angel_fulfilment_services_session', '/', '.angelfs.co.uk'));
        $response->headers->setCookie(cookie()->forget('wings_angel_fulfilment_services_session', '/', '.angelfs.co.uk'));
        $response->headers->setCookie(cookie()->forget('pulse_session', '/', '.angelfs.co.uk'));
        $response->headers->setCookie(cookie()->forget('wings_session', '/', '.angelfs.co.uk'));
        $response->headers->setCookie(cookie()->forget('XSRF-TOKEN', '/', '.angelfs.co.uk'));
        $response->headers->setCookie(cookie()->forget('laravel_session', '/', '.angelfs.co.uk'));
        
        return $response;
    }
}
