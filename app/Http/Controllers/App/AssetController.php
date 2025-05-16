<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Asset\Event;
use App\Models\Employee\Employee;
use App\Helper\Auditing;
use Storage;
use Log;
use DB;

class AssetController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth']);
        $this->middleware(['has.permission:pulse_view_assets']);
    }

    public function index(){
        return Inertia::render('Dashboard/Dashboard');
    }

    public function kit(Request $request){
        $hrId = $request->query('hr_id');

        $items = DB::table('assets.assets_issued')
            ->join('assets.kits', 'kits.kit_id', '=', 'assets_issued.kit_id')
            ->join('assets.assets', 'assets.id', '=', 'kits.asset_id')
            // ->join('assets.kit_items', 'kit_items.kit_id', '=', 'assets.kit_id')
            ->select('assets.alias', 'assets.type', 'assets.afs_id', 'kits.alias as kit_alias')
            ->where('hr_id', $hrId)
            ->where('assets_issued.returned', null)
            ->get();

        $device = $items->where('type', 'Telephone')->pluck('alias')->first();

        if($device)
            $response = DB::table('assets.openvpn_ping_log')
                ->where('datetime', '>=', now()->subDays(7))
                ->where('device', $device)
                ->orderBy('datetime', 'desc')
                ->get();

        return response()->json(array("items" => $items, "device" => $device, "response" => $response ?? []));
    }

    public function events(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $hrId = $request->query('hr_id');

        // Fetch event records for the date range
        $events = Event::whereBetween('on_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->select('support_log.*')
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('support_log.hr_id', $hrId)
            ->leftJoin('wings_config.users', 'users.id', '=', 'support_log.created_by_user_id')
            ->addSelect('users.name as logged_by');
        })
        ->get()
        ->map(function ($record) {
            if (!is_null($record->attachments)) {
                $attachments = json_decode($record->attachments, true);
                $record->attachments = array_map(function ($attachment) {
                    return [
                        'path' => Storage::url($attachment['path']), // Generate public URL for the file
                        'original_name' => $attachment['original_name'], // Include the original filename
                    ];
                }, $attachments);
            }
            return $record;
        });

        return response()->json($events);
    }

    public function remove(Request $request){
        // Define validation rules
        $rules = [
            'eventId' => 'required|numeric',
        ];

        try {
            $event = Event::find($request->eventId);

            if($event && $event->delete()){
                Auditing::log('Support', auth()->user()->id, 'Support Log Event Deleted', 'Event ID: ' . $request->eventId);
                return response()->json(['message' => 'Event removed successfully!'], 200);
            } else {
                return response()->json(['message' => 'Failed to remove the event.'], 500);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error removing event: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to removing the event.'], 500);
        }
    }

    public function resolved(Request $request){
        // Define validation rules
        $rules = [
            'eventId' => 'required|numeric',
        ];

        try {
            $event = Event::find($request->eventId);

            if($event && $event->update(['resolved' => !$event->resolved])){
                Auditing::log('Support', auth()->user()->id, 'Support Log Event Updated', 'Event ID: ' . $request->eventId);
                return response()->json(['message' => 'Event updated successfully!'], 200);
            } else {
                return response()->json(['message' => 'Failed to update the event.'], 500);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating event: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update the event.'], 500);
        }
    }

    public function save(Request $request){

        // Define validation rules
        $rules = [
            'title' => 'required|string|max:100',
            'started.hour' => 'required|string|regex:/^\d{2}$/',
            'started.minute' => 'required|string|regex:/^\d{2}$/',
            'ended.hour' => 'required|string|regex:/^\d{2}$/',
            'ended.minute' => 'required|string|regex:/^\d{2}$/',
            'description' => 'nullable|string|max:500',
            'attachments.*' => 'file|max:10240',
        ];

        // Define custom validation messages
        $messages = [
            'title.required' => 'Please enter a title.',
            'title.string' => 'The title must be a valid string.',
            'title.max' => 'The title must not exceed 100 characters.',
            'started.hour.required' => 'Please select an hour.',
            'started.hour.regex' => 'The hour must be a 2-digit value (e.g., "08").',
            'started.minute.required' => 'Please select a minute.',
            'started.minute.regex' => 'The minute must be a 2-digit value (e.g., "30").',
            'ended.hour.required' => 'Please select an hour.',
            'ended.hour.regex' => 'The hour must be a 2-digit value (e.g., "08").',
            'ended.minute.required' => 'Please select a minute.',
            'ended.minute.regex' => 'The minute must be a 2-digit value (e.g., "30").',
            'description.string' => 'The notes must be a valid string.',
            'description.max' => 'The notes must not exceed 500 characters.',
            'attachments.*.file' => 'Each attachment must be a valid file.',
            'attachments.*.max' => 'Each attachment must not exceed 10MB.',
        ];

        try {
            $request->validate($rules, $messages);

            $user = Employee::where('hr_id', '=', $request->hrID)->first();

            if ($request->eventID) {
                $event = Event::find($request->eventID);
    
                if ($event && $event->attachments) {
                    $existingAttachments = json_decode($event->attachments, true);
    
                    // Delete each file from storage
                    foreach ($existingAttachments as $attachment) {
                        if (isset($attachment['path'])) {
                            Storage::disk('public')->delete($attachment['path']);
                        }
                    }
                }
            }

            $storedAttachments = [];
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('attachments', 'public'); // Store in the 'attachments' directory in 'storage/app/public'
                    $storedAttachments[] = [
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(), // Store the original filename
                    ];
                }
            }

            // Process the validated data
            if ($request->eventID){
                Event::find($request->eventID)->update([
                    'hr_id' => $request->hrID,
                    'user_id' => $user->user_id,
                    'created_by_user_id' => auth()->user()->id,
                    'date' => date("Y-m-d"),
                    'on_time' => date("Y-m-d") . ' ' . $request->started['hour'] . ':' . $request->started['minute'] . ':00',
                    'off_time' => date("Y-m-d") . ' ' . $request->ended['hour'] . ':' . $request->ended['minute'] . ':00',
                    'category' => $request->title,
                    'notes' => $request->description,
                    'attachments' => json_encode($storedAttachments),
                ]);
            }else{
                Event::create([
                    'hr_id' => $request->hrID,
                    'user_id' => $user->user_id,
                    'created_by_user_id' => auth()->user()->id,
                    'date' => date("Y-m-d"),
                    'on_time' => date("Y-m-d") . ' ' . $request->started['hour'] . ':' . $request->started['minute'] . ':00',
                    'off_time' => date("Y-m-d") . ' ' . $request->ended['hour'] . ':' . $request->ended['minute'] . ':00',
                    'category' => $request->title,
                    'notes' => $request->description,
                    'resolved' => false,
                    'attachments' => json_encode($storedAttachments),
                ]);
            }

            // Log the event creation
            Auditing::log('Support', auth()->user()->id, 'Support Log Event Created', 'Event ID: ' . $request->eventID);

            return response()->json(['message' => 'Event saved successfully!'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error saving absence event: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to save absence event.'], 500);
        }
    }
}
