<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Asset\Event;
use App\Models\Asset\Asset;
use App\Models\Asset\Kit;
use App\Models\Asset\Item;
use App\Models\Asset\PAT;
use App\Models\HR\Employee;
use App\Helper\Auditing;
use Storage;
use Log;
use DB;

class AssetController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['has.permission:pulse_view_assets']);
        $this->middleware(['log.access']);
    }

    public function index(){
        return Inertia::render('Dashboard/Dashboard');
    }

    public function scan(Request $request){
        return Inertia::render('Assets/Scan');
    }

    public function find(Request $request){
        $asset = DB::table('assets.assets')
        ->where('afs_id', $request->afs_id)
        ->exists();

        if(!$asset) {
            return response()->json(['message' => 'Asset not found.'], 404);
        }

        if ($asset) {
            return response()->json(['message' => 'Asset found'], 200);
        }
    }

    public function load(Request $request){
        $asset = DB::table('assets.assets')
        ->where('afs_id', $request->afs_id)
        ->first();

        if( !$asset) {
            return response()->json(['message' => 'Asset not found.'], 404);
        }

        $kitHistory = DB::table('assets.kit_log')
        ->where('asset_id', $asset->id)
        ->join('assets.kits', 'kits.id', '=', 'kit_log.kit_id')
        ->select(
            'kit_log.created_at',
            DB::raw('"Assigned to Kit:" as content'),
            'kits.alias as target',
            'kits.id as kit_id'
        )
        ->orderBy('kit_log.created_at', 'desc')
        ->get();

        $assetHistory = DB::table('assets.assets_issued')
        ->join('wings_config.users', 'users.id', '=', 'assets_issued.user_id')
        ->where('asset_id', $asset->id)
        ->select(
            'assets_issued.issued as created_at',
            DB::raw('"Assigned to:" as content'),
            'users.name as target'
        )
        ->get();

        $pat = DB::table('assets.pat_testing')
        ->join('wings_config.users', 'users.id', '=', 'pat_testing.user_id')
        ->where('asset_id', $asset->id)
        ->orderBy('datetime', 'desc')
        ->get();
            
        $history = $kitHistory->merge($assetHistory)->sortByDesc('created_at')->values()->all();

        if(!$kitHistory->count()){
            return response()->json(['asset' => $asset, 'history' => $history, 'kit' => collect([]), 'pat' => $pat], 200);
        }

        $kit = DB::table('assets.kits')
        ->join('assets.kit_items', 'kit_items.kit_id', '=', 'kits.id')
        ->join('assets.assets', 'assets.id', '=', 'kit_items.asset_id')
        ->where('kit_items.kit_id', $kitHistory->first()->kit_id)
        ->select('kits.id', 'kits.alias', 'assets.alias as asset_alias', 'assets.type', 'assets.afs_id')
        ->get();

        if ($asset) {
            return response()->json(['asset' => $asset, 'history' => $history, 'kit' => $kit, 'pat' => $pat], 200);
        }
    }

    public function kit(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $hrId = $request->query('hr_id');

        $items = DB::table('assets.assets_issued')
            ->join('assets.kits', 'kits.id', '=', 'assets_issued.kit_id')
            ->join('assets.kit_items', 'kit_items.kit_id', '=', 'kits.id')
            ->join('assets.assets', 'assets.id', '=', 'kit_items.asset_id')
            ->select('assets.alias', 'assets.type', 'assets.afs_id', 'kits.alias as kit_alias')
            ->where('hr_id', $hrId)
            ->where('assets_issued.returned', null)
            ->get();

        $device = $items->where('type', 'Telephone')->pluck('alias')->first();

        if($device)
            $response = DB::table('assets.openvpn_ping_log')
                ->whereBetween('datetime', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->where('device', $device)
                ->orderBy('datetime', 'desc')
                ->get();

        return response()->json(array("items" => $items, "device" => $device, "response" => $response ?? []));
    }

    public function kits(Request $request){
        $kits = DB::table('assets.kits')
            ->select('kits.id', 'kits.alias')
            ->get();

        return response()->json($kits);
    }

    public function createAsset(Request $request){
        // Define validation rules
        $rules = [
            'assetId' => 'required|numeric',
            'alias' => 'required|string|max:50',
        ];

        // Define custom validation messages
        $messages = [
            'alias.required' => 'Please enter an alias.',
            'alias.string' => 'The alias must be a valid string.',
            'alias.max' => 'The alias must not exceed 50 characters.',
        ];

        try {
            $request->validate($rules, $messages);

            Asset::create([
                'afs_id' => $request->assetId,
                'alias' => $request->alias,
                'type' => $request->type,
                'make' => $request->make,
                'model' => $request->model,
            ]);

            if($request->has('kit') && $request->kit){
                // Create a new kit if it doesn't exist
                $kit = Kit::firstOrCreate([
                    'alias' => $request->kit,
                ]);

                Log::debug('Kit created or found: ' . $kit->alias . ' (ID: ' . $kit->id . ')');

                // Create the kit item.
                Item::create([
                    'kit_id' => $kit->id,
                    'asset_id' => $request->assetId,
                ]);

                // Create the preset kit items if provided
                if(isset($request->items) && is_array($request->items) && count($request->items) > 0){
                    foreach($request->items as $item){
                        Item::create([
                            'kit_id' => $kit->id,
                            'asset_id' => $item,
                        ]);
                    }
                }
            }
        
            return response()->json(['message' => 'Asset created successfully!'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to create asset: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create asset.'], 500);
        }
    }

    public function processPatTest(Request $request){
        // Define validation rules
        $rules = [
            'assetId' => 'required|numeric',
            'type' => 'required|string',
            'earthBond' => 'required_if:type,Class 1|nullable|string',
            'insulation' => 'required_if:type,Class 1,Class 2,Class 2 FE,Lead|nullable|string',
            'continuity' => 'required_if:type,Lead|nullable|string',
            'leakage' => 'required_if:type,Class 1,Class 2,Class 2 FE|nullable|string',
        ];

        $messages = [
            'assetId.required' => 'Please enter an asset ID.',
            'assetId.numeric' => 'The asset ID must be a valid number.',
            'type.required' => 'Please select a test type.',
            'type.string' => 'The test type must be a valid string.',
            'earthBond.required_if' => 'Earth Bond Ω is required for Class 1 tests.',
            'insulation.required_if' => 'Insulation MΩ is required for this test type.',
            'continuity.required_if' => 'Continuity Ω is required for Lead tests.',
            'leakage.required_if' => 'Leakage mA is required for this test type.',
        ];

        try {
            $request->validate($rules, $messages);

            $asset = DB::table('assets.assets')
            ->where('afs_id', $request->assetId)
            ->first();

            PAT::create([
                'asset_id' => $asset->id,
                'expires' => now()->addYear()->format('Y-m-d'),
                'class' => $request->type,
                'vi_socket' => $request->socket ?? null,
                'vi_plug' => $request->plug ?? null,
                'vi_switch' => $request->switch ?? null,
                'vi_flex' => $request->flex ?? null,
                'vi_body' => $request->body ?? null,
                'vi_environment' => $request->environment ?? null,
                'vi_continued_use' => $request->continuedUse ?? null,
                'result' => $request->result ? ucwords($request->result) : null,
                'earth_cont' => $request->earthBond ?? null,
                'ins_resis' => $request->insulation ?? null,
                'continuity' => $request->continuity ?? null,
                'leakage' => $request->leakage ?? null,
                'user_id' => auth()->user()->id,
                'hr_id' => auth()->user()->employee->hr_id,
                'datetime' => now(),
            ]);
        
            return response()->json(['message' => 'PAT test processed successfully!'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to process PAT test: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to process PAT test.'], 500);
        }
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
            ->leftJoin('wings_config.users as logged', 'logged.id', '=', 'support_log.created_by_user_id')
            ->leftJoin('wings_config.users', 'users.id', '=', 'support_log.user_id')
            ->addSelect('logged.name as logged_by', 'users.name as user_name');
        })
        ->get()
        ->map(function ($record) {
            if (!is_null($record->attachments)) {
                $attachments = json_decode($record->attachments, true);
                $record->attachments = array_map(function ($attachment) {
                    return [
                        'path' => Storage::disk('r2')->temporaryUrl($attachment['path'], now()->addMinutes(5)),
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

            // Remove the attachments from storage
            if ($event && $event->attachments) {
                $existingAttachments = json_decode($event->attachments, true);

                // Delete each file from storage
                foreach ($existingAttachments as $attachment) {
                    if (isset($attachment['path'])) {
                        Storage::disk('r2')->delete($attachment['path']);
                    }
                }
            }

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
                            Storage::disk('r2')->delete($attachment['path']);
                        }
                    }
                }
            }

            $storedAttachments = [];
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('support/attachments', 'r2'); // Store in R2
                    $storedAttachments[] = [
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        // 'url' => Storage::disk('r2')->url($path), // Optional: store the URL
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
                Auditing::log('Support', auth()->user()->id, 'Support Log Event Updated', 'Event ID: ' . $request->eventID);
            }else{
                $event = Event::create([
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
                Auditing::log('Support', auth()->user()->id, 'Support Log Event Created', 'Event ID: ' . $event->id);
            }

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
