<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;


class AdministrationController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['has.permission:pulse_view_administration']);
        $this->middleware(['log.access']);
    }

    public function index(){
        return Inertia::render('Administration/Administration');
    }

    public function angelGiftConfigurations(){
        try {
            $angelGiftApiUrl = config('app.angel_gift_api_url', 'https://free-gifts.co.uk/api/template/list');
            $angelGiftApiToken = config('app.angel_gift_api_token');

            $apiResponse = Http::timeout(10)
                ->withToken($angelGiftApiToken)
                ->get($angelGiftApiUrl);
            
            if ($apiResponse->successful()) {
                $configurations = $apiResponse->json('data', []);
                
                // Validate and format the response to ensure it matches expected structure
                $configurations = collect($configurations)->sortBy('client_name')->values()->toArray();

                Log::debug($configurations);
            } else {
                Log::warning('Failed to fetch configurations from API', [
                    'status' => $apiResponse->status(),
                    'response' => $apiResponse->body()
                ]);

                // Fallback to empty array or default configurations
                $configurations = [];
            }
        } catch (\Exception $e) {
            Log::error('Error calling configurations API', [
                'error' => $e->getMessage(),
                'url' => $angelGiftApiUrl ?? 'not configured'
            ]);
            
            // Fallback to empty array
            $configurations = [];
        }

        return response()->json(['configurations' => $configurations]);
    }

    public function totalCPASignUps(){

        $data = DB::connection('wings_config')->table('dashboard_tiles')->find(11)->data;

        if($data && isset(json_decode($data, true)['data']['total_sign_ups']) && is_array(json_decode($data, true)['data']['total_sign_ups'])){
            return response()->json(['total_sign_ups' => array_sum(json_decode($data, true)['data']['total_sign_ups'])]);
        }
    }
}
