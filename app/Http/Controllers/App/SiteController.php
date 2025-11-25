<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\HR\Employee;
use Inertia\Inertia;
use App\Models\User\User;
use DB;
use Log;
use Str;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Notification;
use App\Notifications\FireRollCallNotification;
use App\Helper\Auditing;
use App\Helper\T2SMS;

class SiteController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['guest'])->except('widget', 'triggerFireEmergency', 'rollCall', 'checkActiveFireEvent');
        //$this->middleware(['ipInRange:172.71.0.0,172.71.255.255']);
        $this->middleware(['log.access']);
    }

    public function accessControl($location = 'Lostwithiel'){
        return Inertia::render('Site/Access', [
            'location' => $location,
        ]);
    }

    public function widget(){
        return Inertia::render('Site/Widget');
    }

    public function employees(Request $request){

        if ($request->input('limited', false)) {
            // Fetch limited employee details
            $employees = User::where('client_ref', '=', 'ANGL')
                ->leftJoin('wings_data.hr_details', 'users.id', '=', 'hr_details.user_id')
                ->select('users.id', 'users.name', 'users.qr_token', 'hr_details.profile_photo', 'hr_details.hr_id', 'hr_details.rank', 'hr_details.job_title')
                ->groupBy('users.id')
                ->whereNotNull('hr_details.rank')
                ->where('users.name', 'LIKE', '%'.$request->input('name', '').'%')
                ->where('users.active', 1)
                ->orderBy('name', 'asc')
                ->get();
            return response()->json($employees, 200);
        } else {
            // Fetch all employee details
            $employees = User::where('client_ref', '=', 'ANGL')
                ->leftJoin('wings_data.hr_details', 'users.id', '=', 'hr_details.user_id')
                ->select('users.id', 'users.name', 'users.qr_token', 'hr_details.profile_photo', 'hr_details.hr_id', 'hr_details.rank', 'hr_details.job_title')
                ->groupBy('users.id')
                ->where('users.name', 'LIKE', '%'.$request->input('name', '').'%')
                ->where('users.active', 1)
                ->orderBy('name', 'asc')
                ->get();
        }

        // Fetch all employees with their HR details
        return response()->json($employees, 200);
    }

    public function findUser(Request $request){
        // Fetch employee by GUID
        $signedIn = false;
        $employee = User::where('client_ref', '=', 'ANGL')
            ->where('users.qr_token', $request->input('guid'))
            ->value('id');
        
        if ($employee) {
            return response()->json($employee, 200);
        } else {
            return response()->json(['message' => 'Employee not found'], 404);
        }
    }

    public function hasProfilePhoto(Request $request){
        // Check if user has a profile photo
        $userId = $request->input('user_id', null);
        $hasPhoto = DB::connection('wings_config')->table('wings_data.hr_details')
            ->where('user_id', $userId)
            ->whereNotNull('profile_photo')
            ->exists();

        return response()->json(['has_photo' => $hasPhoto], 200);
    }

    public function setProfilePhoto(Request $request){
        if (!$request->has('profile_photo') || !$request->has('user_id')) {
            return response()->json(['message' => 'No profile photo data provided.'], 422);
        }

        $user = Employee::where('user_id', $request->input('user_id'))->first();

        $data = $request->input('profile_photo');
        if (!$data) {
            return response()->json(['message' => 'No image data provided.'], 422);
        }
        
        // Extract base64 string
        if (preg_match('/^data:image\/(\w+);base64,/', $data, $type)) {
            $data = substr($data, strpos($data, ',') + 1);
            $type = strtolower($type[1]); // jpg, png, gif
    
            $data = base64_decode($data);
            if ($data === false) {
                return response()->json(['message' => 'Base64 decode failed.'], 422);
            }
        } else {
            return response()->json(['message' => 'Invalid image data.'], 422);
        }

        // Remove old profile photo if set
        if ($user->profile_photo) {
            $oldPath = 'profile/images/' . $user->profile_photo;
            if (Storage::disk('r2-public')->exists($oldPath)) {
                Storage::disk('r2-public')->delete($oldPath);
            }
        }
    
        // Generate a unique filename
        $fileName = uniqid('profile_') . '.' . $type;
        $filePath = 'profile/images/' . $fileName;
    
        // Store the image (local disk, change to 'r2' if needed)
        Storage::disk('r2-public')->put($filePath, $data);
    
        // Save the filename/path to the employee
        $user->profile_photo = $fileName;
        $user->save();
    
        return response()->json(['message' => 'Profile photo updated.', 'file' => $fileName]);
    }

    public function isUserSignedInByRequest(Request $request, $userId = null){
        // Check if user is signed in
        if(!$request || !$request->has('user_id')) {
            return response()->json(['message' => 'User ID is required'], 500);
        }

        $userId = $request->input('user_id');

        $status = DB::connection('wings_config')->table('site_access_log')->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->whereIn('type', ['access'])
            ->where('created_at', '>=', date('Y-m-d'))
            ->select(DB::raw('IF(signed_out IS NULL, true, false) as signed_in'))
            ->first();

        if($status && $status->signed_in) {
            return response()->json(['message' => 'User is already signed in'], 400);
        }

        if(!$status || !$status->signed_in) {
            return response()->json(['message' => 'User is not signed in'], 200);
        }
    }

    public function isUserSignedIn($userId){

        $status = DB::connection('wings_config')->table('site_access_log')->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->whereIn('type', ['access'])
            ->where('created_at', '>=', date('Y-m-d'))
            ->select(DB::raw('IF(signed_out IS NULL, true, false) as signed_in'))
            ->first();

        return $status ? $status->signed_in : false;
    }

    public function access(){
        $deliveries = DB::connection('wings_config')
            ->table('site_access_log')
            ->where('type', 'delivery')
            ->where('created_at', '>=', date('Y-m-d'))
            ->orderBy('created_at', 'desc')
            ->get();

        $visitors = DB::connection('wings_config')
            ->table('site_access_log as sal1')
            ->join(
                DB::raw('
                    (
                        SELECT visitor_name, MAX(created_at) as latest_created
                        FROM site_access_log
                        WHERE type = "access"
                        AND category IN ("visitor", "contractor")
                        AND created_at >= CURDATE()
                        GROUP BY visitor_name
                    ) as latest
                '), 
                function ($join) {
                    $join->on('sal1.visitor_name', '=', 'latest.visitor_name')
                        ->on('sal1.created_at', '=', 'latest.latest_created');
                }
            )
            ->whereIn('sal1.category', ['visitor', 'contractor']) // optional—keeps result tidy
            ->select('sal1.*')
            ->orderByDesc('sal1.created_at')
            ->get();

        $employees = DB::connection('wings_config')
            ->table('site_access_log as sal1')
            ->join(
                DB::raw('
                    (
                        SELECT user_id, MAX(created_at) as latest_created, MIN(signed_in) as earliest_signed_in
                        FROM site_access_log
                        WHERE type = "access"
                        AND category = "employee"
                        AND created_at >= CURDATE()
                        GROUP BY user_id
                    ) as latest
                '), 
                function ($join) {
                    $join->on('sal1.user_id', '=', 'latest.user_id')
                        ->on('sal1.created_at', '=', 'latest.latest_created');
                }
            )
            ->leftJoin('wings_data.hr_details', 'sal1.user_id', '=', 'hr_details.user_id')
            ->leftJoin('users', 'sal1.user_id', '=', 'users.id')
            ->select(
                'sal1.id',
                'sal1.user_id',
                'sal1.created_at',
                'sal1.signed_in',
                'sal1.signed_out',
                'sal1.location',
                'sal1.category',
                'latest.earliest_signed_in',
                'hr_details.profile_photo',
                'hr_details.job_title',
                'users.name as fullname'
            )
            ->orderByDesc('sal1.created_at')
            ->get();

        return response()->json([
            'deliveries' => $deliveries,
            'visitors' => $visitors,
            'employees' => $employees
        ], 200);
    }

    public function signedIn(Request $request){
        // Check if user is signed in
        $signedIn = DB::connection('wings_config')
            ->table('site_access_log')
            ->leftJoin('users', 'site_access_log.user_id', '=', 'users.id')
            ->leftJoin('wings_data.hr_details', 'users.id', '=', 'hr_details.user_id')
            ->orderBy('site_access_log.created_at', 'asc')
            ->whereIn('site_access_log.type', ['access'])
            ->where('site_access_log.category', '=', $request->input('category', 'employee'))
            ->whereNull('site_access_log.signed_out')
            ->where('site_access_log.created_at', '>=', date('Y-m-d'))
            ->select(
                'site_access_log.id',
                'users.id as user_id',
                DB::raw('
                    IF(users.name IS NOT NULL, 
                        CONCAT(
                            SUBSTRING_INDEX(users.name, " ", 1), " ", 
                            LEFT(SUBSTRING_INDEX(users.name, " ", -1), 1), REPEAT("*", LENGTH(SUBSTRING_INDEX(users.name, " ", -1)) - 1)
                        ), 
                        CONCAT(
                            SUBSTRING_INDEX(site_access_log.visitor_name, " ", 1), " ", 
                            LEFT(SUBSTRING_INDEX(site_access_log.visitor_name, " ", -1), 1), REPEAT("*", LENGTH(SUBSTRING_INDEX(site_access_log.visitor_name, " ", -1)) - 1)
                        )
                    ) as display_name,
                    hr_details.profile_photo,
                    hr_details.job_title
                ')
            )
            ->get();

        if ($signedIn->isEmpty()) {
            return response()->json(['message' => 'No users signed in'], 404);
        } else {
            return response()->json($signedIn, 200);
        }
    }

    public function signInOrOut(Request $request){
        try {
            $employee = $request->input('user_id', null);
            $signedIn = $this->isUserSignedIn($employee);

            if (!$signedIn){
                DB::connection('wings_config')->table('site_access_log')->insert([
                    'type' => 'access',
                    'category' => 'employee',
                    'signed_in' => date('Y-m-d H:i:s'),
                    'location' => Str::title($request->input('location', null)),
                    'user_id' => $request->input('user_id', null),
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                $action = 'sign-in';
            } else {
                DB::connection('wings_config')->table('site_access_log')->where('user_id', '=', $employee)->whereNull('signed_out')->orderBy('created_at', 'desc')->limit(1)->update([
                    'signed_out' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                $action = 'sign-out';
            }
            return response()->json(['message' => 'Signed in successfully', 'action' => $action], 200);
        } catch (\Throwable $th) {
            return response()->json(['message' => 'Error processing sign in/out'], 500);         
        }
    }

    public function signInOrOutByAuth(Request $request){
        try {
            $data = $request->json()->all();

            $employee = auth()->user()->id;

            $signedIn = $this->isUserSignedIn($employee);

            if (!$signedIn){
                DB::connection('wings_config')->table('site_access_log')->insert([
                    'type' => 'access',
                    'category' => 'employee',
                    'signed_in' => date('Y-m-d H:i:s'),
                    'location' => Str::title($data['location'] ?? null),
                    'user_id' => $employee,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                $action = 'sign-in';
            } else {
                DB::connection('wings_config')->table('site_access_log')->where('user_id', '=', $employee)->whereNull('signed_out')->orderBy('created_at', 'desc')->limit(1)->update([
                    'signed_out' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                $action = 'sign-out';
            }
            return response()->json(['message' => 'Signed in / out successfully', 'action' => $action], 200);
        } catch (\Throwable $th) {
            return response()->json(['message' => 'Error processing sign in/out'], 500);
        }
    }

    
    public function signInByAuth(Request $request){
        try {
            $data = $request->json()->all();

            $employee = auth()->user()->id;

            $signedIn = $this->isUserSignedIn($employee);

            if (!$signedIn){
                DB::connection('wings_config')->table('site_access_log')->insert([
                    'type' => 'access',
                    'category' => 'employee',
                    'signed_in' => date('Y-m-d H:i:s'),
                    'location' => Str::title($data['location'] ?? null),
                    'user_id' => $employee,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                $action = 'sign-in';
            } else {
                return response()->json(['message' => 'User is already signed in'], 400);
            }
            return response()->json(['message' => 'Signed in successfully', 'action' => $action], 200);
        } catch (\Throwable $th) {
            return response()->json(['message' => 'Error processing sign in/out'], 500);
        }
    }

    public function signOutByAuth(Request $request){
        try {
            $data = $request->json()->all();

            $employee = auth()->user()->id;

            $signedIn = $this->isUserSignedIn($employee);

            if ($signedIn){
                DB::connection('wings_config')->table('site_access_log')->where('user_id', '=', $employee)->whereNull('signed_out')->orderBy('created_at', 'desc')->limit(1)->update([
                    'signed_out' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                $action = 'sign-out';
            } else {
                return response()->json(['message' => 'User is already signed out'], 400);
            }
            return response()->json(['message' => 'Signed out successfully', 'action' => $action], 200);
        } catch (\Throwable $th) {
            return response()->json(['message' => 'Error processing sign in/out'], 500);
        }
    }

    public function signIn(Request $request){

        if($request->has('user_id') && $this->isUserSignedIn($request->input('user_id'))) {
            return response()->json(['message' => 'User is already signed in'], 400);
        }

        DB::connection('wings_config')->table('site_access_log')->insert([
            'type' => $request->input('type', null),
            'category' => $request->input('category', null),
            'signed_in' => date('Y-m-d H:i:s'),
            'location' => Str::title($request->input('location', null)),
            'user_id' => $request->input('user_id', null),
            'visitor_name' => $request->input('visitor_name', null),
            'visitor_company' => $request->input('visitor_company', null),
            'visitor_visiting' => $request->input('visitor_visiting', null),
            'visitor_visiting_user_id' => $request->input('visitor_visiting_user_id', null),
            'visitor_car_registration' => strtoupper($request->input('visitor_car_registration', null)),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return response()->json(['message' => 'Signed in successfully'], 200);
    }

    public function signOut(Request $request){

        if($request->has('user_id') && !$this->isUserSignedIn($request->input('user_id'))) {
            return response()->json(['message' => 'User is already signed out'], 400);
        }

        if($request->has('id')) {
            DB::connection('wings_config')->table('site_access_log')->where('id', '=', $request->input('id'))->limit(1)->update([
                'signed_out' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        } else {
            DB::connection('wings_config')->table('site_access_log')->where('user_id', '=', $request->has('user_id'))->whereNull('signed_out')->orderBy('created_at', 'desc')->limit(1)->update([
                'signed_out' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        }

        return response()->json(['message' => 'Signed out successfully'], 200);
    }

    public function cameraViewer(Request $request){
        return Inertia::render('Site/CameraViewer');
    }

    // WebRTC signaling methods for camera streaming
    private $streamingOffers = [];
    private $streamingAnswers = [];
    private $iceCandidates = [];

    /**
     * Handle stream offer from QR Scanner - stores PeerJS peer ID for discovery
     */
    public function handleStreamOffer(Request $request) {
        $offer = $request->input('offer');
        $streamId = $request->input('streamId', 'default');
        
        if (!$offer) {
            return response()->json(['error' => 'No offer provided'], 400);
        }
        
        // Store PeerJS peer ID in cache for cross-browser access
        \Cache::put("stream_offer_{$streamId}", $offer, 300); // 5 minutes
        
        \Log::info('QR Scanner peer ID stored in cache', [
            'streamId' => $streamId,
            'peerId' => $offer['peerId'] ?? 'unknown'
        ]);
        
        return response()->json(['status' => 'offer_stored']);
    }
    
    /**
     * Get available stream offer for viewer - returns PeerJS peer ID
     */
    public function getStreamOffer(Request $request) {
        $streamId = $request->input('streamId', 'qr-scanner-stream');
        $offer = \Cache::get("stream_offer_{$streamId}");
        
        if (!$offer) {
            return response()->json(['offer' => null]);
        }
        
        return response()->json(['offer' => $offer]);
    }

    /**
     * Clear stored PeerJS peer IDs when needed
     */
    public function clearCameraOffers(Request $request) {
        // Clear PeerJS peer IDs from cache
        // Note: This is a simple implementation - in production you might want to track keys
        try {
            // Try to clear known stream IDs
            \Cache::forget('stream_offer_qr-scanner-stream');
            \Cache::forget('stream_offer_default');
            
            \Log::info('Camera offers cleared');
        } catch (\Exception $e) {
            \Log::warning('Error clearing camera offers: ' . $e->getMessage());
        }
        
        return response()->json(['status' => 'offers_cleared']);
    }

    public function rollCall(Request $request)
    {
        // Verify the signed URL is valid
        if (!$request->hasValidSignature()) {
            abort(403, 'This roll call link has expired or is invalid.');
        }

        // Fetch access data for roll call
        $deliveries = DB::connection('wings_config')
            ->table('site_access_log')
            ->where('type', 'delivery')
            ->where('created_at', '>=', date('Y-m-d'))
            ->orderBy('created_at', 'desc')
            ->get();

        $visitors = DB::connection('wings_config')
            ->table('site_access_log as sal1')
            ->join(
                DB::raw('
                    (
                        SELECT visitor_name, MAX(created_at) as latest_created
                        FROM site_access_log
                        WHERE type = "access"
                        AND category IN ("visitor", "contractor")
                        AND created_at >= CURDATE()
                        GROUP BY visitor_name
                    ) as latest
                '), 
                function ($join) {
                    $join->on('sal1.visitor_name', '=', 'latest.visitor_name')
                        ->on('sal1.created_at', '=', 'latest.latest_created');
                }
            )
            ->whereIn('sal1.category', ['visitor', 'contractor'])
            ->where('sal1.location', 'Lostwithiel') // Filter to Lostwithiel only
            ->select('sal1.*')
            ->orderByDesc('sal1.created_at')
            ->get();

        $employees = DB::connection('wings_config')
            ->table('site_access_log as sal1')
            ->join(
                DB::raw('
                    (
                        SELECT user_id, MAX(created_at) as latest_created, MIN(signed_in) as earliest_signed_in
                        FROM site_access_log
                        WHERE type = "access"
                        AND category = "employee"
                        AND created_at >= CURDATE()
                        GROUP BY user_id
                    ) as latest
                '), 
                function ($join) {
                    $join->on('sal1.user_id', '=', 'latest.user_id')
                        ->on('sal1.created_at', '=', 'latest.latest_created');
                }
            )
            ->leftJoin('wings_data.hr_details', 'sal1.user_id', '=', 'hr_details.user_id')
            ->leftJoin('users', 'sal1.user_id', '=', 'users.id')
            ->where('sal1.location', 'Lostwithiel') // Filter to Lostwithiel only
            ->select(
                'sal1.id',
                'sal1.user_id',
                'sal1.created_at',
                'sal1.signed_in',
                'sal1.signed_out',
                'sal1.location',
                'sal1.category',
                'latest.earliest_signed_in',
                'hr_details.profile_photo',
                'hr_details.job_title',
                'users.name as fullname'
            )
            ->orderByDesc('sal1.created_at')
            ->get();

        return Inertia::render('Site/RollCall', [
            'initialVisitors' => $visitors,
            'initialEmployees' => $employees,
        ]);
    }

    public function triggerFireEmergency(Request $request)
    {
        $validated = $request->validate([
            'source' => 'required|in:access_control,authenticated',
            'photo' => 'nullable|string', // Base64 encoded photo
        ]);

        $source = $validated['source'];
        $userId = auth()->check() ? auth()->id() : 1954; // 1954 = Access Control System User
        $userName = auth()->check() ? auth()->user()->name : 'Access Control System';

        // Save photo if provided (from access control camera)
        $photoPath = null;
        if (!empty($validated['photo'])) {
            $photoPath = $this->savePhoto($validated['photo']);
        }

        // Get all users with pulse_fire_warden permission that are currently onsite
        $users = User::where('users.active', 1)
            ->where('users.client_ref', 'ANGL')
            ->whereHas('assignedPermissionsUser', function($query) {
                $query->where('right', 'pulse_fire_warden');
            })
            ->whereExists(function($query) {
                $query->select(DB::raw(1))
                    ->from('wings_config.site_access_log as sal')
                    ->whereColumn('sal.user_id', 'users.id')
                    ->whereDate('sal.created_at', '>=', DB::raw('CURDATE()'))
                    ->whereNull('sal.signed_out')
                    ->where('sal.type', 'access')
                    ->where('sal.category', 'employee');
            })
            ->with('employee')
            ->get();

        if ($users->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No fire wardens found onsite'
            ], 400);
        }

        // Generate temporary signed URL (valid for 24 hours)
        $rollCallUrl = URL::temporarySignedRoute(
            'fire.roll-call',
            now()->addHours(1)
        );

        // Send SMS to all users
        foreach ($users as $user) {
            if ($user->employee->contact_mobile_phone) {
                $smsMessage = "FIRE EMERGENCY\n\n" .
                              "A fire emergency has been reported.\n" .
                              "Please confirm everyone's safety immediately:\n\n" .
                              $rollCallUrl;

                T2SMS::sendSms('Angel', $user->employee->contact_mobile_phone, $smsMessage);
            }
        }

        // Send email notifications
        $emailData = [
            'triggered_by' => $userName,
            'triggered_at' => now()->format('d/m/Y H:i:s'),
            'roll_call_url' => $rollCallUrl,
            'photo_path' => $photoPath,
        ];

        Notification::send($users, new FireRollCallNotification($emailData));

        // Create audit log
        $auditNotes = json_encode([
            'source' => $source,
            'triggered_by' => $userName,
            'user_id' => $userId,
            'users_notified' => $users->count(),
            'photo_saved' => !is_null($photoPath),
            'timestamp' => now()->toIso8601String(),
        ]);

        Auditing::log('fire_emergency', $userId, 'Fire emergency alert triggered', $auditNotes);

        return response()->json([
            'success' => true,
            'message' => 'Fire emergency alert sent successfully',
            'users_notified' => $users->count(),
        ]);
    }

    /**
     * Save camera photo to R2 bucket
     */
    private function savePhoto($base64Photo)
    {
        try {
            // Remove data:image/jpeg;base64, prefix if present
            $photo = preg_replace('/^data:image\/\w+;base64,/', '', $base64Photo);
            $photo = base64_decode($photo);

            // Generate filename
            $filename = 'fire/photos/' . now()->format('Y-m-d_His') . '_' . uniqid() . '.jpg';

            // Save to private R2 bucket
            Storage::disk('r2')->put($filename, $photo, 'private');

            return $filename;
        } catch (\Exception $e) {
            \Log::error('Failed to save fire emergency photo: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check for active fire events in the last hour
     * Returns event ID if found, null otherwise
     */
    public function checkActiveFireEvent(Request $request)
    {
        // Look for fire_emergency audit logs in the last hour
        $activeEvent = DB::connection('wings_config')->table('audit_log_pulse')
            ->where('type', 'fire_emergency')
            ->where('created_at', '>=', now()->subHour())
            ->orderBy('created_at', 'desc')
            ->first();

        if ($activeEvent) {
            return response()->json([
                'active' => true,
                'event_id' => $activeEvent->id,
                'triggered_at' => $activeEvent->created_at,
            ]);
        }

        return response()->json([
            'active' => false,
        ]);
    }
}
