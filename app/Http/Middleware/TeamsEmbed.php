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
        // Detect if running in Teams via query param or cookie
        $inTeams = $request->query('teams') === 'true' || $request->cookie('in_teams') === 'true';

        $response = $next($request);

        // Modify headers and set cookie for Teams
        if ($inTeams) {
            // Remove X-Frame-Options to allow iframe embedding
            $response->headers->remove('X-Frame-Options');

            // Set Content-Security-Policy to allow Teams domains only
            $response->headers->set(
                'Content-Security-Policy',
                "frame-ancestors 'self' https://teams.microsoft.com https://*.teams.microsoft.com https://*.office.com https://*.microsoft.com"
            );

            // Set a cookie to remember Teams mode (with SameSite=None for iframe)
            $response->headers->setCookie(
                cookie('in_teams', 'true', 60 * 24 * 7, '/', null, true, true, false, 'None')
            );
        }

        return $response;
    }
}
