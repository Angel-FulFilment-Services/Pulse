<?php

namespace App\Http\Middleware;

use Closure;

class IpInRange
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $lowIp
     * @param  string  $highIp
     * @return mixed
     */
    public function handle($request, Closure $next, $lowIp, $highIp)
    {
        // Only run in production or staging environments
        if (app()->environment(['production', 'staging'])) {
            // Convert the low and high IPs to ip2long for numerical comparison
            $lowIpLong = ip2long(trim($lowIp));
            $highIpLong = ip2long(trim($highIp));

            // Validate the IP range
            if ($lowIpLong === false || $highIpLong === false || $lowIpLong > $highIpLong) {
                return response()->json(['message' => 'Invalid IP range configuration.'], 500);
            }

            // Check if the request IP is within the specified range
            $requestIpLong = ip2long($request->ip());
            if ($requestIpLong < $lowIpLong || $requestIpLong > $highIpLong) {
                return response()->json(['message' => 'Access denied. Your IP is not within the allowed range.'], 403);
            }
        }

        return $next($request);
    }
}