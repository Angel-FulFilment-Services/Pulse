<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Chat\UserStatus;
use Symfony\Component\HttpFoundation\Response;

class UpdateActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            // Update or create user status with current timestamp
            UserStatus::updateOrCreate(
                ['user_id' => $request->user()->id],
                [
                    'status' => 'online',
                    'last_active_at' => now()
                ]
            );
        }

        return $next($request);
    }
}
