<?php

namespace App\Http\Middleware;

use Closure;

class WhitelistedIp
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $ipList
     * @return mixed
     */
    public function handle($request, Closure $next, $ipList)
    {
        // Only run in production or staging environments
        if (app()->environment(['production', 'staging'])) {
            // Convert the plain text list of IPs into an array
            $ipRanges = explode(',', $ipList);

            // Convert IPs to ip2long for numerical comparison
            $whitelistedRanges = array_map(function ($ip) {
                return ip2long(trim($ip));
            }, $ipRanges);

            // Ensure the list contains valid ranges (start and end IPs)
            if (count($whitelistedRanges) % 2 !== 0) {
                return response()->json(['message' => 'Invalid IP range configuration.'], 500);
            }

            // Check if the request IP is within any of the whitelisted ranges
            $requestIpLong = ip2long($request->ip());
            $isWhitelisted = false;

            for ($i = 0; $i < count($whitelistedRanges); $i += 2) {
                if ($requestIpLong >= $whitelistedRanges[$i] && $requestIpLong <= $whitelistedRanges[$i + 1]) {
                    $isWhitelisted = true;
                    break;
                }
            }

            if (!$isWhitelisted) {
                return response()->json(['message' => 'Access denied. Your IP is not whitelisted.'], 403);
            }
        }

        return $next($request);
    }
}