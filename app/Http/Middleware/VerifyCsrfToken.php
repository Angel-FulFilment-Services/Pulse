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
     * Determine if the request has a valid CSRF token.
     * Skip CSRF for Teams embedded requests.
     */
    protected function tokensMatch($request)
    {
        // Skip CSRF verification for Teams embedded requests
        if ($request->query('teams') === 'true' || $request->cookie('in_teams') === 'true') {
            return true;
        }

        return parent::tokensMatch($request);
    }
}
