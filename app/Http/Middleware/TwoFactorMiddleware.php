<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Helper\Permissions;

class twofactorMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();
        if (auth()->check() && (Permissions::hasPermission('email_2fa_enabled') || Permissions::hasPermission('sms_2fa_enabled')) && $user->pulse_two_factor_code) {
            if ($user->pulse_two_factor_expires_at < now()) {
                $user->reset_two_factor_code();
                auth()->logout();
                return redirect()->route('login')
                    ->withStatus('Your one-time verification passcode has expired. Please login to receive another.');
            }
            if (!$request->is('verify*')) {
                return redirect()->route('verify');
            }
        }
        return $next($request);
    }
}
