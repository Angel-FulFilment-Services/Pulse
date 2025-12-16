<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        //
    ];

    /**
     * Routes that are safe to skip CSRF for when in Teams.
     */
    protected $teamsExcept = [
        'login',
        'logout',
        'chat/*',
        'broadcasting/auth',
    ];

    /**
     * Determine if the request has a valid CSRF token.
     * Skip CSRF for Teams embedded requests on safe routes only.
     */
    protected function tokensMatch($request)
    {
        // Check if in Teams
        $inTeams = $request->query('teams') === 'true' || $request->cookie('in_teams') === 'true';
        
        if ($inTeams) {
            // Only skip CSRF for specific safe routes
            foreach ($this->teamsExcept as $pattern) {
                if ($request->is($pattern)) {
                    return true;
                }
            }
        }

        return parent::tokensMatch($request);
    }
}
