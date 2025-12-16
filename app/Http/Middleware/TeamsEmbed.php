<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TeamsEmbed
{
    /**
     * Handle an incoming request.
     * 
     * Allows Microsoft Teams to embed the application in an iframe.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only modify headers if the request is from Teams
        if ($request->query('teams') === 'true') {
            // Remove X-Frame-Options to allow iframe embedding
            $response->headers->remove('X-Frame-Options');

            // Set Content-Security-Policy to allow Teams domains only
            $response->headers->set(
                'Content-Security-Policy',
                "frame-ancestors 'self' https://teams.microsoft.com https://*.teams.microsoft.com https://*.office.com https://*.microsoft.com"
            );
        }

        return $response;
    }
}
