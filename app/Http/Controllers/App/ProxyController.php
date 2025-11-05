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

    /**
     * Get FlashForge 3D Printer Status via Server-Sent Events
     * This streams status updates every 5 seconds without blocking the browser
     */
    public function printerStatusStream(Request $request)
    {
        set_time_limit(0);
        
        return response()->stream(function () {
            $printerIp = '192.168.3.209';
            $port = 8899;
            $timeout = 5;
            
            while (true) {
                try {
                    // Open TCP socket connection
                    $socket = @fsockopen($printerIp, $port, $errno, $errstr, $timeout);
                    
                    if (!$socket) {
                        echo "data: " . json_encode(['error' => "Unable to connect to printer"]) . "\n\n";
                        ob_flush();
                        flush();
                        sleep(5);
                        continue;
                    }

                    // Set timeout for socket operations
                    stream_set_timeout($socket, $timeout);

                    // Get general status (M119)
                    fwrite($socket, "~M119\r\n");
                    $generalResponse = $this->readSocketResponse($socket);

                    // Get temperature (M105)
                    fwrite($socket, "~M105\r\n");
                    $tempResponse = $this->readSocketResponse($socket);

                    // Get build progress (M27)
                    fwrite($socket, "~M27\r\n");
                    $progressResponse = $this->readSocketResponse($socket);

                    fclose($socket);

                    // Parse responses into structured data
                    $status = [
                        'general' => $this->parseGeneralStatus($generalResponse),
                        'temperature' => $this->parseTemperature($tempResponse),
                        'progress' => $this->parseProgress($progressResponse),
                    ];

                    // Send as Server-Sent Event
                    echo "data: " . json_encode($status) . "\n\n";
                    ob_flush();
                    flush();

                } catch (\Exception $e) {
                    echo "data: " . json_encode(['error' => $e->getMessage()]) . "\n\n";
                    ob_flush();
                    flush();
                }
                
                // Wait 5 seconds before next update
                sleep(5);
                
                // Check if client disconnected
                if (connection_aborted()) {
                    break;
                }
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Get FlashForge 3D Printer Status (single request)
     */
    public function printerStatus(Request $request)
    {
        $printerIp = '192.168.3.209';
        $port = 8899;
        $timeout = 5;

        try {
            // Open TCP socket connection
            $socket = @fsockopen($printerIp, $port, $errno, $errstr, $timeout);
            
            if (!$socket) {
                return response()->json([
                    'error' => "Unable to connect to printer: $errstr ($errno)"
                ], 503);
            }

            // Set timeout for socket operations
            stream_set_timeout($socket, $timeout);

            // Get general status (M119)
            fwrite($socket, "~M119\r\n");
            $generalResponse = $this->readSocketResponse($socket);

            // Get temperature (M105)
            fwrite($socket, "~M105\r\n");
            $tempResponse = $this->readSocketResponse($socket);

            // Get build progress (M27)
            fwrite($socket, "~M27\r\n");
            $progressResponse = $this->readSocketResponse($socket);

            fclose($socket);

            // Parse responses into structured data
            $status = [
                'general' => $this->parseGeneralStatus($generalResponse),
                'temperature' => $this->parseTemperature($tempResponse),
                'progress' => $this->parseProgress($progressResponse),
                'raw' => [
                    'general' => $generalResponse,
                    'temperature' => $tempResponse,
                    'progress' => $progressResponse,
                ]
            ];

            return response()->json($status);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unable to connect to printer: ' . $e->getMessage()
            ], 500);
        }
    }

    private function readSocketResponse($socket)
    {
        $response = '';
        $startTime = microtime(true);
        
        while (!feof($socket)) {
            $chunk = fgets($socket, 1024);
            if ($chunk === false) break;
            
            $response .= $chunk;
            
            // Check for "ok" terminator or timeout after 2 seconds
            if (strpos($response, 'ok') !== false || (microtime(true) - $startTime) > 2) {
                break;
            }
        }
        
        return trim($response);
    }

    private function parseGeneralStatus($response)
    {
        $data = [];
        
        // Extract Endstop values
        if (preg_match('/Endstop: X-max: (\d+) Y-max: (\d+) Z-min: (\d+)/', $response, $matches)) {
            $data['endstop'] = [
                'x_max' => (int)$matches[1],
                'y_max' => (int)$matches[2],
                'z_min' => (int)$matches[3],
            ];
        }

        // Extract MachineStatus
        if (preg_match('/MachineStatus: (\w+)/', $response, $matches)) {
            $data['machine_status'] = $matches[1];
        }

        // Extract MoveMode
        if (preg_match('/MoveMode: (\w+)/', $response, $matches)) {
            $data['move_mode'] = $matches[1];
        }

        // Extract Status flags
        if (preg_match('/Status: S:(\d+) L:(\d+) J:(\d+) F:(\d+)/', $response, $matches)) {
            $data['status_flags'] = [
                's' => (int)$matches[1],
                'l' => (int)$matches[2],
                'j' => (int)$matches[3],
                'f' => (int)$matches[4],
            ];
        }

        // Extract LED status
        if (preg_match('/LED: (\d+)/', $response, $matches)) {
            $data['led'] = (int)$matches[1];
        }

        // Extract current file
        if (preg_match('/CurrentFile: (.+)/', $response, $matches)) {
            $data['current_file'] = trim($matches[1]);
        }

        return $data;
    }

    private function parseTemperature($response)
    {
        $data = [];
        
        // Extract temperatures: T0:255.3/255.0 T1:0.0/0.0 B:80.1/80.0
        if (preg_match('/T0:([\d.]+)\/([\d.]+)/', $response, $matches)) {
            $data['extruder_0'] = [
                'current' => (float)$matches[1],
                'target' => (float)$matches[2],
            ];
        }

        if (preg_match('/T1:([\d.]+)\/([\d.]+)/', $response, $matches)) {
            $data['extruder_1'] = [
                'current' => (float)$matches[1],
                'target' => (float)$matches[2],
            ];
        }

        if (preg_match('/B:([\d.]+)\/([\d.]+)/', $response, $matches)) {
            $data['bed'] = [
                'current' => (float)$matches[1],
                'target' => (float)$matches[2],
            ];
        }

        return $data;
    }

    private function parseProgress($response)
    {
        $data = [];
        
        // Extract SD printing progress: SD printing byte 6/100
        if (preg_match('/SD printing byte (\d+)\/(\d+)/', $response, $matches)) {
            $data['bytes'] = [
                'current' => (int)$matches[1],
                'total' => (int)$matches[2],
                'percentage' => $matches[2] > 0 ? round(($matches[1] / $matches[2]) * 100, 2) : 0,
            ];
        }

        // Extract layer progress: Layer: 8/327
        if (preg_match('/Layer: (\d+)\/(\d+)/', $response, $matches)) {
            $data['layers'] = [
                'current' => (int)$matches[1],
                'total' => (int)$matches[2],
                'percentage' => $matches[2] > 0 ? round(($matches[1] / $matches[2]) * 100, 2) : 0,
            ];
        }

        return $data;
    }
}
