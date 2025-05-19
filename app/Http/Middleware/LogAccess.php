<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\System\Access;
use Illuminate\Support\Facades\Auth;

class LogAccess
{
    public function handle(Request $request, Closure $next)
    {
        $start = microtime(true);

        $response = $next($request);

        if (app()->environment('local')) {
            return $response;
        }

        try {
            $user = Auth::user();
            $duration = (int)((microtime(true) - $start) * 1000);

            Access::create([
                'method'           => $request->method(),
                'url'              => $request->fullUrl(),
                'route_name'       => optional($request->route())->getName(),
                'user_id'          => $user?->id,
                'ip_address'       => $request->ip(),
                'x_forwarded_for'  => $request->header('X-Forwarded-For'),
                'user_agent'       => $request->userAgent(),
                'referrer'         => $request->header('referer'),
                'status_code'      => $response->getStatusCode(),
                'request_params'   => $request->except(['password', 'token', '_token']),
                'session_id'       => $request->session()->getId(),
                'user_roles'       => $user ? implode(',', $user->assignedPermissions()->pluck('right')->toArray()) : null,
                'duration_ms'      => $duration,
            ]);
        } catch (\Throwable $e) {
            // Optionally log or ignore errors here
        }

        return $response;
    }
}