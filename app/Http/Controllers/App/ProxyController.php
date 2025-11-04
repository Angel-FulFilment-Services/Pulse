<?php

namespace App\Http\Controllers\App;

use Illuminate\Http\Request;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use App\Http\Controllers\Controller;

class ProxyController extends Controller
{
    /**
     * Proxy camera stream from HTTP to HTTPS
     */
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['has.permission:pulse_view_administration']);
        $this->middleware(['log.access']);
    }

    public function cameraStream(Request $request)
    {
        // Disable PHP execution time limit for continuous stream
        set_time_limit(0);
        
        // Disable output buffering
        if (ob_get_level()) {
            ob_end_clean();
        }
        
        $cameraUrl = 'http://192.168.3.209:8080?action=stream';
        
        try {
            $client = new Client([
                'timeout' => 0, // No timeout for continuous stream
                'connect_timeout' => 5, // Keep short connect timeout
                'verify' => false,
            ]);
            
            // Stream the response from the camera
            $response = $client->get($cameraUrl, [
                'stream' => true,
            ]);
            
            $stream = $response->getBody();
            
            // Return streaming response
            return response()->stream(
                function () use ($stream) {
                    while (!$stream->eof()) {
                        echo $stream->read(8192); // Larger buffer for better performance
                        if (ob_get_level()) {
                            ob_flush();
                        }
                        flush();
                    }
                },
                200,
                [
                    'Content-Type' => $response->getHeader('Content-Type')[0] ?? 'multipart/x-mixed-replace; boundary=--BoundaryString',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                    'X-Accel-Buffering' => 'no', // Disable nginx buffering
                ]
            );
        } catch (RequestException $e) {
            \Log::error('Camera RequestException: ' . $e->getMessage());
            if ($e->hasResponse()) {
                \Log::error('Response: ' . $e->getResponse()->getBody());
            }
            return response()->json([
                'error' => 'Camera stream unavailable',
                'message' => $e->getMessage()
            ], 503);
        } catch (\Exception $e) {
            \Log::error('Camera Exception: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Camera stream error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
