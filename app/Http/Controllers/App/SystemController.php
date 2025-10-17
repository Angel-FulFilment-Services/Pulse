<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Log;

class SystemController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['log.access']);
    }

public function clients(Request $request){
    try {
        // Authentication
        // if (!$request->bearerToken() || $request->bearerToken() !== config('api.clients_token')) {
        //     return response()->json(['error' => 'Unauthorized'], 401);
        // }
        
        // Cache key with search parameters
        $cacheKey = 'api_clients_' . md5($request->getQueryString());
        
        $clients = Cache::remember($cacheKey, 300, function () use ($request) {
            $query = DB::connection('halo_config')->table('client_tables')
                ->select('unq_id as id', 'clientref as client_ref', 'clientname as client_name')
                ->where(function ($query) {
                    $query->whereNull('active')
                          ->orWhere('active','=', '');
                })
                ->groupBy('clientname');
            
            return $query->get()->map(function ($client) {
                return [
                    'id' => $client->id,
                    'value' => $client->client_name,
                    'client_ref' => $client->client_ref
                ];
            });
        });
        
        Log::info('Clients API called', [
            'ip' => $request->ip(),
            'clients_count' => $clients->count(),
            'search' => $request->get('search')
        ]);
        
        return response()->json([
            'status' => 'success',
            'data' => $clients,
            'meta' => [
                'count' => $clients->count(),
                'timestamp' => now()->toISOString(),
                'search_applied' => $request->has('search')
            ]
        ], 200);
        
    } catch (\Exception $e) {
        Log::error('Clients API error', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch clients',
            'error_code' => 'CLIENTS_FETCH_ERROR'
        ], 500);
    }
}
}
