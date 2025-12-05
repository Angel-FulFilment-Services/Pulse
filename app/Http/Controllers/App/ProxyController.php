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
        $this->middleware(['has.permission:pulse_view_administration'])->except('biginPipelineStatus');
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
                    // Send a small initial chunk to signal the iframe is "loaded"
                    // This prevents the browser from showing infinite loading
                    echo ' ';
                    if (ob_get_level()) {
                        ob_flush();
                    }
                    flush();
                    
                    while (!$stream->eof()) {
                        echo $stream->read(8192); // Larger buffer for better performance
                        if (ob_get_level()) {
                            ob_flush();
                        }
                        flush();
                        
                        // Check if client disconnected
                        if (connection_aborted()) {
                            break;
                        }
                    }
                },
                200,
                [
                    'Content-Type' => $response->getHeader('Content-Type')[0] ?? 'multipart/x-mixed-replace; boundary=--BoundaryString',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                    'X-Accel-Buffering' => 'no', // Disable nginx buffering
                    'Connection' => 'keep-alive', // Keep connection alive
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

                    // Get JSON-style response with time estimates (M408)
                    fwrite($socket, "~M408\r\n");
                    $m408Response = $this->readSocketResponse($socket);

                    fclose($socket);

                    // Parse responses into structured data
                    $status = [
                        'general' => $this->parseGeneralStatus($generalResponse),
                        'temperature' => $this->parseTemperature($tempResponse),
                        'progress' => $this->parseProgress($progressResponse),
                        'estimates' => $this->parseM408($m408Response),
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

            // Get JSON-style response with time estimates (M408)
            fwrite($socket, "~M408\r\n");
            $m408Response = $this->readSocketResponse($socket);

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
                    'estimates' => $this->parseM408($m408Response),
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

    private function parseM408($response)
    {
        $data = [];
        
        // M408 returns JSON-style response with comprehensive printer info
        // Example: {"status":"P","heaters":[25.0,210.0],"pos":[0,0,5],"extr":[0.0],"sfactor":100.00,"timesLeft":[3600,3800,3700],...}
        
        // Try to decode as JSON
        $json = json_decode($response, true);
        
        if ($json && is_array($json)) {
            // Extract timesLeft array (estimated remaining times in seconds from different calculation methods)
            if (isset($json['timesLeft']) && is_array($json['timesLeft'])) {
                $timesLeft = array_filter($json['timesLeft'], function($time) {
                    return $time !== null && $time > 0;
                });
                
                if (!empty($timesLeft)) {
                    // Use the first valid time estimate
                    $remainingSeconds = reset($timesLeft);
                    $data['remaining_seconds'] = $remainingSeconds;
                    $data['remaining_formatted'] = sprintf('%d:%02d:%02d', 
                        floor($remainingSeconds / 3600), 
                        floor(($remainingSeconds % 3600) / 60), 
                        $remainingSeconds % 60
                    );
                    
                    // Include all estimates if multiple methods available
                    if (count($timesLeft) > 1) {
                        $data['all_estimates'] = $timesLeft;
                    }
                }
            }
            
            // Extract fraction_printed (more accurate than byte-based progress)
            if (isset($json['fraction_printed'])) {
                $data['fraction_printed'] = (float)$json['fraction_printed'];
                $data['percent'] = round($json['fraction_printed'] * 100, 2);
            }
            
            // Extract print status
            if (isset($json['status'])) {
                $data['status'] = $json['status']; // I=idle, P=printing, S=stopped, etc.
            }
        }

        return $data;
    }

    /**
     * Get Bigin Pipeline Status
     * Fetches all pipeline records (deals) from Bigin CRM
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function biginPipelineStatus(Request $request)
    {
        try {
            // Get Bigin access token from environment
            $accessToken = env('BIGIN_CLIENT_ID');
            
            if (!$accessToken) {
                return response()->json([
                    'error' => 'Bigin access token not configured',
                    'message' => 'Please set BIGIN_CLIENT_ID in your .env file'
                ], 500);
            }

            $client = new Client([
                'timeout' => 30,
                'verify' => false,
            ]);

            // Bigin EU API endpoint for Pipelines (Deals)
            $url = 'https://www.zohoapis.eu/bigin/v2/Pipelines';
            
            // Request parameters
            $params = [
                'fields' => 'Deal_Name,Stage,Amount,Closing_Date,Pipeline,Sub_Pipeline,Owner,Account_Name,Contact_Name,Modified_Time,Created_Time',
                'per_page' => 200, // Max records per page
                'sort_order' => 'desc',
                'sort_by' => 'Modified_Time',
            ];

            // Add optional filters from request
            if ($request->has('page')) {
                $params['page'] = $request->input('page');
            }
            
            if ($request->has('stage')) {
                // Note: For filtering by stage, you would need to use COQL API or custom views
                // This basic endpoint doesn't support direct stage filtering
            }

            $response = $client->get($url, [
                'headers' => [
                    'Authorization' => 'Zoho-oauthtoken ' . $accessToken,
                ],
                'query' => $params,
            ]);

            $statusCode = $response->getStatusCode();
            $body = json_decode($response->getBody()->getContents(), true);

            if ($statusCode === 200 && isset($body['data'])) {
                // Group pipelines by stage for easy visualization
                $groupedByStage = [];
                $groupedByPipeline = [];
                $totalAmount = 0;
                $dealCount = 0;

                foreach ($body['data'] as $deal) {
                    $stage = $deal['Stage'] ?? 'Unknown';
                    $pipelineName = $deal['Pipeline']['name'] ?? 'Unknown';
                    $amount = $deal['Amount'] ?? 0;
                    
                    // Group by stage
                    if (!isset($groupedByStage[$stage])) {
                        $groupedByStage[$stage] = [
                            'deals' => [],
                            'count' => 0,
                            'total_amount' => 0,
                        ];
                    }
                    
                    $groupedByStage[$stage]['deals'][] = $deal;
                    $groupedByStage[$stage]['count']++;
                    $groupedByStage[$stage]['total_amount'] += $amount;
                    
                    // Group by pipeline
                    if (!isset($groupedByPipeline[$pipelineName])) {
                        $groupedByPipeline[$pipelineName] = [
                            'deals' => [],
                            'count' => 0,
                            'total_amount' => 0,
                            'stages' => [],
                        ];
                    }
                    
                    $groupedByPipeline[$pipelineName]['deals'][] = $deal;
                    $groupedByPipeline[$pipelineName]['count']++;
                    $groupedByPipeline[$pipelineName]['total_amount'] += $amount;
                    
                    if (!isset($groupedByPipeline[$pipelineName]['stages'][$stage])) {
                        $groupedByPipeline[$pipelineName]['stages'][$stage] = 0;
                    }
                    $groupedByPipeline[$pipelineName]['stages'][$stage]++;
                    
                    $totalAmount += $amount;
                    $dealCount++;
                }

                return response()->json([
                    'success' => true,
                    'data' => $body['data'],
                    'info' => $body['info'] ?? null,
                    'summary' => [
                        'total_deals' => $dealCount,
                        'total_amount' => $totalAmount,
                        'by_stage' => $groupedByStage,
                        'by_pipeline' => $groupedByPipeline,
                    ],
                ]);
            }

            return response()->json([
                'error' => 'Unexpected response from Bigin API',
                'response' => $body,
            ], $statusCode);

        } catch (RequestException $e) {
            \Log::error('Bigin API RequestException: ' . $e->getMessage());
            
            $statusCode = $e->hasResponse() ? $e->getResponse()->getStatusCode() : 500;
            $errorBody = $e->hasResponse() ? json_decode($e->getResponse()->getBody()->getContents(), true) : null;
            
            return response()->json([
                'error' => 'Bigin API request failed',
                'message' => $e->getMessage(),
                'details' => $errorBody,
            ], $statusCode);
            
        } catch (\Exception $e) {
            \Log::error('Bigin API Exception: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Bigin API error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
