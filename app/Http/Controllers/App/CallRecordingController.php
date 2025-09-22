<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Helper\CallRecordings;

class CallRecordingController extends Controller
{
    /**
     * Block logged out users from using this functionality
     */
    public function __construct()
    {
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['log.access']);
    }

    /**
     * Convert Apex call data to audio format (Generic AJAX endpoint)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function convertCall(Request $request)
    {
        try {
            $apexId = $request->input('apexId');
            
            if (empty($apexId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Apex ID is required'
                ], 400);
            }

            // Get converted recording data using the helper function
            $recordingResult = CallRecordings::getConvertedRecording($apexId);
            
            if (!$recordingResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get recording: ' . $recordingResult['message']
                ], 500);
            }
                        
            return response()->json([
                'success' => true,
                'data' => $recordingResult['data'],
                'message' => 'Call converted successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error converting Apex call: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to convert call data: ' . $e->getMessage()
            ], 500);
        }
    }
}