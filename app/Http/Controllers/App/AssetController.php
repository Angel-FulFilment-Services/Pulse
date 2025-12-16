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
use App\Models\User\User;
use App\Helper\Auditing;
use App\Models\Asset\EquipmentReturn;
use App\Notifications\EquipmentReturnNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Storage;
use Log;
use DB;
use Carbon\Carbon;

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

    public function loadAsset(Request $request){

        if ($request->has('afs_id') && $request->afs_id) {
            $asset = DB::table('assets.assets')
            ->where('afs_id', $request->afs_id)
            ->first();
        }

        if ($request->has('asset_id') && $request->asset_id) {
            $asset = DB::table('assets.assets')
            ->where('id', $request->asset_id)
            ->first();
        }

        if( !$asset) {
            return response()->json(['message' => 'Asset not found.'], 404);
        }

        $kitHistory = DB::table('assets.kit_log')
        ->where('asset_id', $asset->id)
        ->join('assets.kits', 'kits.id', '=', 'kit_log.kit_id')
        ->select(
            'kit_log.created_at',
            DB::raw('IF(kit_log.type = "Added", "Assigned to Kit:", "Removed from Kit:") as content'),
            'kit_log.type',
            'kits.alias as target',
            'kits.id as kit_id'
        )
        ->orderBy('kit_log.created_at', 'desc')
        ->get();

        $assetHistory = DB::table('assets.asset_log')
        ->join('wings_config.users', 'users.id', '=', 'asset_log.user_id')
        ->where('asset_id', $asset->id)
        ->select(
            'asset_log.issued_date as created_at',
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

        if(!$kitHistory->count() || $kitHistory->first()->type == 'Removed'){
            return response()->json(['asset' => $asset, 'history' => $history, 'kit' => collect([]), 'pat' => $pat], 200);
        }

        $kit = DB::table('assets.kits')
            ->join('assets.kit_items', 'kit_items.kit_id', '=', 'kits.id')
            ->join('assets.assets', 'assets.id', '=', 'kit_items.asset_id')
            ->where('kit_items.kit_id', $kitHistory->first()->kit_id)
            ->select('kits.id', 'kits.alias', 'assets.alias as asset_alias', 'assets.type', 'assets.afs_id', 'assets.id as asset_id')
            ->orderByRaw('
                CASE 
                    WHEN assets.afs_id > 0 THEN 0 
                    ELSE 1 
                END, 
                assets.afs_id ASC, 
                assets.alias ASC
            ')
            ->get();

        if ($asset) {
            return response()->json(['asset' => $asset, 'history' => $history, 'kit' => $kit, 'pat' => $pat], 200);
        }
    }

    public function loadKit(Request $request){
        $kit = DB::table('assets.kits')
        ->where('id', $request->kit_id)
        ->first();

        if(!$kit) {
            return response()->json(['message' => 'Kit not found.'], 404);
        }

        $items = DB::table('assets.kit_items')
            ->join('assets.assets', 'assets.id', '=', 'kit_items.asset_id')
            ->where('kit_items.kit_id', $request->kit_id)
            ->select('assets.alias as asset_alias', 'assets.type', 'assets.afs_id', 'assets.id as asset_id')
            ->get();

        $log = DB::table('assets.kit_log')
            ->where('kit_id', $request->kit_id)
            ->select(DB::raw('CAST(kit_log.created_at as DATE) AS created_at'), 'kit_log.asset_id', 'kit_log.type', 'kit_log.kit_id', 'kit_log.user_id', DB::raw('"Log" as source'))
            ->orderBy('created_at', 'asc')
            ->get();

        $issued = DB::table('assets.asset_log')
            ->where('kit_id', $request->kit_id)
            ->join('wings_config.users', 'users.id', '=', 'asset_log.user_id')
            ->select(DB::raw('COALESCE(issued_date, returned_date) as created_at'), 'asset_id', 'kit_id', 'user_id', 'users.name', DB::raw('IF(returned = false, "Issued", "Returned") as status'), DB::raw('"Issue" as source'))
            ->orderBy('created_at', 'asc')
            ->get();

        $history = $log->merge($issued)->sortByDesc('created_at')->values()->all();

        return response()->json(['kit' => $kit, 'items' => $items, 'history' => $history], 200);
    }

    public function addKitItem(Request $request){
        // Define validation rules
        $rules = [
            'kit_id' => 'required|numeric',
            'asset_id' => 'required|numeric',
        ];

        try {
            $request->validate($rules);

            $kit = Kit::find($request->kit_id);
            if(!$kit) {
                return response()->json(['message' => 'Kit not found.'], 404);
            }

            $asset = Asset::find($request->asset_id);
            if(!$asset) {
                return response()->json(['message' => 'Asset not found.'], 404);
            }

            $item = Item::where('asset_id', $asset->id)->first();
            if($item){
                return response()->json(['message' => 'Asset is already part of a kit.'], 400);
            }

            // Create the kit item.
            Item::create([
                'kit_id' => $kit->id,
                'asset_id' => $asset->id,
            ]);

            DB::table('assets.kit_log')->insert([
                'kit_id' => $kit->id,
                'asset_id' => $asset->id,
                'type' => 'Added',
                'user_id' => auth()->user()->id,
                'hr_id' => auth()->user()->employee->hr_id,
                'created_at' => now(),
            ]);

            Auditing::log('Assets', auth()->user()->id, 'Kit Item Added', 'Kit ID: ' . $kit->id . ', Asset ID: ' . $asset->id);

            return response()->json(['message' => 'Item added to kit successfully!'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to add item to kit: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to add item to kit.'], 500);
        }
    }

    public function removeKitItem(Request $request){
        // Define validation rules
        $rules = [
            'kit_id' => 'required|numeric',
            'asset_id' => 'required|numeric',
        ];

        try {
            $request->validate($rules);

            $kit = Kit::find($request->kit_id);
            if(!$kit) {
                return response()->json(['message' => 'Kit not found.'], 404);
            }

            $item = Item::where('kit_id', $kit->id)->where('asset_id', $request->asset_id)->first();
            if(!$item) {
                return response()->json(['message' => 'Item not found in kit.'], 404);
            }

            // Delete the kit item.
            $item->delete();

            DB::table('assets.kit_log')->insert([
                'kit_id' => $kit->id,
                'asset_id' => $request->asset_id,
                'type' => 'Removed',
                'user_id' => auth()->user()->id,
                'hr_id' => auth()->user()->employee->hr_id,
                'created_at' => now(),
            ]);

            Auditing::log('Assets', auth()->user()->id, 'Kit Item Removed', 'Kit ID: ' . $kit->id . ', Asset ID: ' . $request->asset_id);

            return response()->json(['message' => 'Item removed from kit successfully!'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to remove item from kit: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to remove item from kit.'], 500);
        }
    }

    public function assignKit(Request $request){
        // Define validation rules
        $rules = [
            'kit_id' => 'required|numeric',
            'user_id' => 'required|numeric',
        ];

        try {
            $request->validate($rules);

            $kit = Kit::find($request->kit_id);
            if(!$kit) {
                return response()->json(['message' => 'Kit not found.'], 404);
            }

            $user = Employee::where('user_id', $request->user_id)->first();
            if(!$user) {
                return response()->json(['message' => 'Employee not found.'], 404);
            }

            // Create new kit log entry for new assignment
            DB::table('assets.asset_log')->insert([
                'kit_id' => $kit->id,
                'asset_id' => null,
                'user_id' => $request->user_id,
                'hr_id' => $user->hr_id,
                'issued' => true,
                'issued_date' => date('Y-m-d'),
            ]);

            Auditing::log('Assets', auth()->user()->id, 'Kit Assigned', 'Kit ID: ' . $kit->id . ', User ID: ' . $request->user_id);

            return response()->json([$user->user], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to assign kit: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to assign kit.'], 500);
        }
    }

    public function unassignKit(Request $request){
        // Define validation rules
        $rules = [
            'kit_id' => 'required|numeric',
            'user_id' => 'required|numeric',
        ];

        try {
            $request->validate($rules);

            $kit = Kit::find($request->kit_id);
            if(!$kit) {
                return response()->json(['message' => 'Kit not found.'], 404);
            }

            $user = Employee::where('user_id', $request->user_id)->first();
            if(!$user) {
                return response()->json(['message' => 'Employee not found.'], 404);
            }

            // Create new kit log entry for return
            DB::table('assets.asset_log')->insert([
                'kit_id' => $kit->id,
                'asset_id' => null,
                'user_id' => $user->user_id,
                'hr_id' => $user->hr_id,
                'returned' => true,
                'returned_date' => date('Y-m-d'),
            ]);

            Auditing::log('Assets', auth()->user()->id, 'Kit Unassigned', 'Kit ID: ' . $kit->id . ', User ID: ' . $request->user_id);

            return response()->json(['message' => 'Kit unassigned successfully!'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to unassign kit: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to unassign kit.'], 500);
        }
    }

    public function markKit(Request $request){
        // Define validation rules
        $rules = [
            'kit_id' => 'required|numeric',
            'active' => 'required|boolean',
        ];

        try {
            $request->validate($rules);

            $kit = Kit::find($request->kit_id);
            if(!$kit) {
                return response()->json(['message' => 'Kit not found.'], 404);
            }

            // Update the kit status
            $kit->update(['active' => $request->active]);

            Auditing::log('Assets', auth()->user()->id, 'Kit Status Updated', 'Kit ID: ' . $request->kit_id . ', New Status: ' . $request->status);

            return response()->json(['message' => 'Kit status updated successfully!'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update kit status: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update kit status.'], 500);
        }
    }

    public function isKitActive(Request $request){
        // Define validation rules
        $rules = [
            'kit_alias' => 'required|string',
        ];

        try {
            $request->validate($rules);

            $kit = Kit::where('alias', '=', $request->kit_alias)->first();
            if(!$kit) {
                return response()->json(['message' => 'Kit not found.'], 404);
            }

            return response()->json(['active' => $kit->active], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to check kit status: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to check kit status.'], 500);
        }
    }

    public function createAsset(Request $request){
        // Define validation rules
        $rules = [
            'afsId' => 'nullable|numeric',
            'alias' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'make' => 'nullable|string|max:255',
            'type' => 'required|string',
        ];

        // Define custom validation messages
        $messages = [
            'afsId.numeric' => 'The asset ID must be a valid number.',
            'alias.string' => 'The alias must be a valid string.',
            'alias.max' => 'The alias must not exceed 255 characters.',
            'model.string' => 'The model must be a valid string.',
            'model.max' => 'The model must not exceed 255 characters.',
            'make.string' => 'The make must be a valid string.',
            'make.max' => 'The make must not exceed 255 characters.',
            'type.required' => 'Please select a valid asset type.',
            'type.string' => 'The asset type must be a valid string.',
        ];

        try {
            // $request->validate($rules, $messages);

            // Check if an asset with the same AFS ID already exists and if provided, if the alias is already in use#
            if($request->has('afsId') && $request->afsId){
                $asset = Asset::where('afs_id', $request->afsId)->first();
                if($asset) {
                    return response()->json(['message' => 'This asset already exists.', 'asset' => $asset->id], 400);
                }
            }

            $asset = Asset::create([
                'status' => 'Active',
                'afs_id' => $request->afsId,
                'alias' => $request->alias,
                'type' => $request->type,
                'make' => $request->make,
                'model' => $request->model,
            ]);

            if($request->has('kit') && $request->kit){
                // Create a new kit if it doesn't exist
                $kit = Kit::firstOrCreate([
                    'alias' => $request->kit,
                    'active' => true,
                ]);

                // Create the kit item.
                Item::create([
                    'kit_id' => $kit->id,
                    'asset_id' => $asset->id,
                ]);

                DB::table('assets.kit_log')->insert([
                    'kit_id' => $kit->id,
                    'asset_id' => $asset->id,
                    'type' => 'Added',
                    'user_id' => auth()->user()->id,
                    'hr_id' => auth()->user()->employee->hr_id,
                    'created_at' => now(),
                ]);

                // Create the preset kit items if provided
                if(isset($request->items) && is_array($request->items) && count($request->items) > 0){
                    foreach($request->items as $item){
                        Item::create([
                            'kit_id' => $kit->id,
                            'asset_id' => $item,
                        ]);

                        DB::table('assets.kit_log')->insert([
                            'kit_id' => $kit->id,
                            'asset_id' => $item,
                            'type' => 'Added',
                            'user_id' => auth()->user()->id,
                            'hr_id' => auth()->user()->employee->hr_id,
                            'created_at' => now(),
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

    public function markAsset(Request $request){
        // Define validation rules
        $rules = [
            'asset_id' => 'required|numeric',
            'status' => 'required|string|in:Active,Retired,Lost,Stolen,Recycled',
        ];

        try {
            $request->validate($rules);

            $asset = Asset::find($request->asset_id);
            if(!$asset) {
                return response()->json(['message' => 'Asset not found.'], 404);
            }

            // Update the asset status
            $asset->update(['status' => $request->status]);

            Auditing::log('Assets', auth()->user()->id, 'Asset Status Updated', 'Asset ID: ' . $request->asset_id . ', New Status: ' . $request->status);

            return response()->json(['message' => 'Asset status updated successfully!'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update asset status: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update asset status.'], 500);
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
            ->where('id', $request->assetId)
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

    public function processEquipmentReturn(Request $request){
        // Validation rules
        $rules = [
            'kit_id' => 'required|numeric',
            'notes' => 'nullable|string|max:500',
            'attachments.*' => 'file|max:10240',
            'functioning' => 'array',
            'faulty' => 'array',
            'damaged' => 'array',
            'not_returned' => 'array',
            'user_id' => 'required|numeric',
        ];

        $messages = [
            'attachments.*.file' => 'Each attachment must be a valid file.',
            'attachments.*.max' => 'Each attachment must not exceed 10MB.',
        ];

        try {
            $request->validate($rules, $messages);

            // Handle attachments (store in R2)
            $storedAttachments = [];
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('returns/attachments', 'r2');
                    $storedAttachments[] = [
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                    ];
                }
            }

            $user = Employee::where('user_id', '=', $request->user_id)->first();
            if (!$user) {
                return response()->json(['message' => 'Employee not found.'], 404);
            }

            // Store the return record
            EquipmentReturn::create([
                'datetime' => now(),
                'kit_id' => $request->kit_id,
                'notes' => $request->notes,
                'attachments' => json_encode($storedAttachments),
                'items_faulty' => json_encode($request->faulty ?? []),
                'items_damaged' => json_encode($request->damaged ?? []),
                'items_functioning' => json_encode($request->functioning ?? []),
                'items_not_returned' => json_encode($request->not_returned ?? []),
                'processed_by_hr_id' => auth()->user()->employee->hr_id ?? null,
                'processed_by_user_id' => auth()->user()->id ?? null,
                'returned_by_hr_id' => $user->hr_id ?? null,
                'returned_by_user_id' => $user->user_id ?? null,
            ]);

            if($request->retire == true){
                foreach ($request->faulty ?? [] as $item) {
                    DB::table('assets.kit_log')->insert([
                        'kit_id' => $request->kit_id,
                        'asset_id' => $item,
                        'type' => 'Removed',
                        'user_id' => auth()->user()->id,
                        'hr_id' => auth()->user()->employee->hr_id,
                        'created_at' => now(),
                    ]);

                    Item::where('kit_id', $request->kit_id)
                        ->where('asset_id', $item)
                        ->delete();

                    $asset = Asset::find($item);
                    if ($asset && !in_array($asset->type, ['Furniture', 'Patch Lead', 'USB Power Cable', 'Peripherals'])) {    
                        Asset::where('id', $item)
                            ->update(['status' => 'Retired']);
                    }
                }

                foreach ($request->damaged ?? [] as $item) {
                    DB::table('assets.kit_log')->insert([
                        'kit_id' => $request->kit_id,
                        'asset_id' => $item,
                        'type' => 'Removed',
                        'user_id' => auth()->user()->id,
                        'hr_id' => auth()->user()->employee->hr_id,
                        'created_at' => now(),
                    ]);

                    Item::where('kit_id', $request->kit_id)
                        ->where('asset_id', $item)
                        ->delete();

                    $asset = Asset::find($item);
                    if ($asset && !in_array($asset->type, ['Furniture', 'Patch Lead', 'USB Power Cable', 'Peripherals'])) {
                        Asset::where('id', $item)
                            ->update(['status' => 'Damaged']);
                    }
                }
            }

            DB::table('assets.asset_log')->insert([
                'kit_id' => $request->kit_id,
                'user_id' => $user->user_id,
                'hr_id' => $user->hr_id,
                'returned' => true,
                'returned_date' => date('Y-m-d'),
            ]);
            
            // Optionally, log the action
            Auditing::log('Assets', auth()->user()->id, 'Equipment Return Processed', 'Kit ID: ' . $request->kit_id);

            // Send email notification to users with permission
            try {
                $this->sendEquipmentReturnNotification($request, $user, $storedAttachments);
            } catch (\Exception $e) {
                \Log::warning('Failed to send equipment return email notification: ' . $e->getMessage());
                // Don't fail the entire process if email fails
            }

            return response()->json(['message' => 'Equipment return processed successfully!'], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to process equipment return: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to process equipment return.'], 500);
        }
    }

    public function kit(Request $request){
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $hrId = $request->query('hr_id');

        $returnedKitIds = DB::table('assets.asset_log')
        ->where('hr_id', $hrId)
        ->where('returned', true)
        ->pluck('kit_id');

        $kit = DB::table('assets.asset_log')
            ->where('issued', true)
            ->where('returned', false)
            ->whereNotIn('kit_id', $returnedKitIds)
            ->where('hr_id', $hrId)
            ->orderBy('issued_date', 'desc')
            ->groupBy('kit_id')
            ->first();

        if(!$kit) {
            return response()->json(['message' => 'No assigned kit found for this employee.'], 404);
        }

        $items = DB::table('assets.kits')
            ->join('assets.kit_items', 'kit_items.kit_id', '=', 'kits.id')
            ->join('assets.assets', 'assets.id', '=', 'kit_items.asset_id')
            ->select('kits.id as kit_id', 'kits.alias as kit_alias', 'assets.alias as alias', 'assets.type', 'assets.afs_id')
            ->where('kits.id', $kit->kit_id)
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

    public function assets(Request $request){
        $available = $request->query('available', false);

        $assets = DB::table('assets.assets')
            ->when($available, function ($query) {    
                $query->leftJoin('assets.kit_items', function($join) {
                    $join->on('kit_items.asset_id', '=', 'assets.id')
                        ->whereNotIn('assets.type', ['Patch Lead', 'USB Power Cable', 'Peripherals', 'Headset', 'USB Mouse', 'USB Keyboard']);
                })
                ->where('kit_items.kit_id', null);
            })
            ->select(
                'assets.id as id',
                'assets.afs_id as value', 
                DB::raw('IF(assets.afs_id > 0 ,IF(assets.alias != "", CONCAT(assets.afs_id, " - ", assets.alias), CONCAT(assets.afs_id, " - ", assets.type)), assets.alias) as displayValue'),
            )
            ->where('assets.afs_id', '!=', 0)
            ->orWhereIn('assets.type', ['Patch Lead', 'USB Power Cable', 'Peripherals', 'Headset'])
            ->orderBy('assets.afs_id', 'asc')
            ->orderBy('assets.alias', 'asc')
            ->get();

        return response()->json($assets);
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

    public function saveSupportEvent(Request $request){

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

    /**
     * Send equipment return notification email
     */
    private function sendEquipmentReturnNotification($request, $returnedToUser, $attachments)
    {
        // Get users with the permission to receive equipment return emails
        $recipients = User::whereHas('assignedPermissionsUser', function($query) {
            $query->where('right', 'pulse_receive_equipment_return_emails');
        })->get();

        if ($recipients->isEmpty()) {
            \Log::info('No users found with pulse_receive_equipment_return_emails permission');
            return;
        }

        // Get kit information
        $kit = Kit::find($request->kit_id);
        if (!$kit) {
            \Log::error('Kit not found for ID: ' . $request->kit_id);
            return;
        }

        // Get processed by user information
        $processedByUser = auth()->user()->employee;
        if (!$processedByUser) {
            \Log::error('Processed by user not found');
            return;
        }

        // Get return record
        $returnRecord = EquipmentReturn::where('kit_id', $request->kit_id)
            ->orderBy('datetime', 'desc')
            ->first();

        if (!$returnRecord) {
            \Log::error('Return record not found for kit ID: ' . $request->kit_id);
            return;
        }

        // Collect all return items with their details
        $returnItems = [];
        
        // Add functioning items
        foreach ($request->functioning ?? [] as $assetId) {
            $asset = Asset::find($assetId);
            if ($asset) {
                $returnItems[] = [
                    'afs_id' => $asset->afs_id,
                    'alias' => $asset->alias,
                    'type' => $asset->type,
                    'status' => 'functioning'
                ];
            }
        }

        // Add faulty items
        foreach ($request->faulty ?? [] as $assetId) {
            $asset = Asset::find($assetId);
            if ($asset) {
                $returnItems[] = [
                    'afs_id' => $asset->afs_id,
                    'alias' => $asset->alias,
                    'type' => $asset->type,
                    'status' => 'faulty'
                ];
            }
        }

        // Add damaged items
        foreach ($request->damaged ?? [] as $assetId) {
            $asset = Asset::find($assetId);
            if ($asset) {
                $returnItems[] = [
                    'afs_id' => $asset->afs_id,
                    'alias' => $asset->alias,
                    'type' => $asset->type,
                    'status' => 'damaged'
                ];
            }
        }

        // Add not returned items
        foreach ($request->not_returned ?? [] as $assetId) {
            $asset = Asset::find($assetId);
            if ($asset) {
                $returnItems[] = [
                    'afs_id' => $asset->afs_id,
                    'alias' => $asset->alias,
                    'type' => $asset->type,
                    'status' => 'not_returned'
                ];
            }
        }

        // Sort return items by AFS ID first, then by alias
        usort($returnItems, function($a, $b) {
            // Items with AFS IDs should come first
            $aHasAfsId = !empty($a['afs_id']) && $a['afs_id'] !== 0 && $a['afs_id'] !== '0';
            $bHasAfsId = !empty($b['afs_id']) && $b['afs_id'] !== 0 && $b['afs_id'] !== '0';
            
            // If one has AFS ID and other doesn't, prioritize the one with AFS ID
            if ($aHasAfsId && !$bHasAfsId) {
                return -1; // a comes first
            }
            if (!$aHasAfsId && $bHasAfsId) {
                return 1; // b comes first
            }
            
            // Both have AFS IDs - sort numerically
            if ($aHasAfsId && $bHasAfsId) {
                $afsComparison = (int)$a['afs_id'] - (int)$b['afs_id'];
                if ($afsComparison != 0) {
                    return $afsComparison;
                }
            }
            
            // Both don't have AFS IDs, or AFS IDs are the same - sort by alias
            return strcmp($a['alias'] ?? '', $b['alias'] ?? '');
        });

        // Send email to each recipient
        foreach ($recipients as $recipient) {
            try {
                $recipient->notify(new EquipmentReturnNotification(
                    $returnRecord,
                    $kit,
                    $returnedToUser,
                    $processedByUser,
                    $returnItems,
                    $attachments
                ));
            } catch (\Exception $e) {
                \Log::error('Failed to send equipment return notification to ' . $recipient->email . ': ' . $e->getMessage());
            }
        }
    }

    public function assignable_users(Request $request){
        // Fetch all users with their HR details
        $users = User::where('client_ref', '=', 'ANGL')
            ->leftJoin('wings_data.hr_details', 'users.id', '=', 'hr_details.user_id')
            ->leftJoin('assets.asset_log', function($join) {
                $join->on('asset_log.user_id', '=', 'users.id')
                    ->where('asset_log.issued', '=', 1)
                    ->where('asset_log.returned', '=', 0);
            })
            ->select('users.id', 'users.name', 'users.email', 'hr_details.profile_photo', 'hr_details.hr_id', 'hr_details.rank', 'hr_details.job_title', 'asset_log.id as asset_log_id')
            ->groupBy('users.id')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($users, 200);
    }

    public function batchImportPreview(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
        ]);

        try {
            $file = $request->file('csv_file');
            $csvData = array_map('str_getcsv', file($file->getPathname()));

            $preview = [
                'assets_to_create' => [],
                'assets_to_update' => [],
                'assets_to_retire' => [],
                'kit_changes' => [],
                'pat_tests_to_create' => [],
                'errors' => []
            ];

            foreach ($csvData as $index => $row) {
                $rowNumber = $index + 1;
                
                $data = [
                    'afs_id' => $row[0] ?? '',
                    'alias' => $row[1] ?? '',
                    'type' => $row[2] ?? '',
                    'make' => $row[3] ?? '',
                    'model' => $row[4] ?? '',
                    'status' => 'Active',
                    'acq_date' => $row[5] ?? '',
                    'supplier' => $row[6] ?? '',
                    'kit_alias' => $row[7] ?? '',
                    'pat_class' => $row[8] ?? '',
                    'pat_vi_socket' => $row[9] ? true : false,
                    'pat_vi_plug' => $row[9] ? true : false,
                    'pat_vi_switch' => $row[9] ? true : false,
                    'pat_vi_flex' => $row[9] ? true : false,
                    'pat_vi_body' => $row[9] ? true : false,
                    'pat_vi_environment' => $row[9] ? true : false,
                    'pat_vi_continued_use' => $row[9] ? true : false,
                    'pat_ins_resis' => $row[10] ?? '',
                    'pat_earth_cont' => $row[11] ?? '',
                    'pat_leakage' => $row[12] ?? '',
                    'pat_continuity' => $row[13] ?? '',
                    'pat_result' => in_array(strtoupper($row[14]), ['PASSED', 'PASS', 'Y']) ? true : false,
                ];

                try {
                    // Process asset preview
                    $this->previewAssetChanges($data, $rowNumber, $preview);

                    // Process PAT test preview
                    $this->previewPATTestChanges($data, $rowNumber, $preview);

                    // Process kit assignment preview
                    $this->previewKitChanges($data, $rowNumber, $preview);

                } catch (\Exception $e) {
                    Log::error("Error processing row {$rowNumber} in batch import preview: " . $e->getMessage());
                    $preview['errors'][] = "Row {$rowNumber}: " . $e->getMessage();
                }
            }

            return response()->json([
                'message' => 'Batch import preview generated',
                'preview' => $preview
            ], 200);

        } catch (\Exception $e) {
            Log::error('Asset batch import preview failed: ' . $e->getMessage());
            return response()->json(['message' => 'Preview generation failed: ' . $e->getMessage()], 500);
        }
    }

    public function batchImport(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
        ]);

        try {
            $file = $request->file('csv_file');
            $csvData = array_map('str_getcsv', file($file->getPathname()));

            $results = [
                'created' => 0,
                'updated' => 0,
                'retired' => [],
                'errors' => [],
                'kits_created' => []
            ];

            DB::beginTransaction();
            
            foreach ($csvData as $index => $row) {
                $rowNumber = $index + 1; // +1 because array is 0-indexed
                
                // Assuming the row data is in the expected order: afs_id, alias, type, make, model, status, acq_date, supplier, pat_*, kit_alias
                $data = [
                    'afs_id' => $row[0] ?? '',
                    'alias' => $row[1] ?? '',
                    'type' => $row[2] ?? '',
                    'make' => $row[3] ?? '',
                    'model' => $row[4] ?? '',
                    'status' => 'Active',
                    'acq_date' => $row[5] ? Carbon::createFromFormat('d/m/Y', $row[5])->format('Y-m-d') : null,
                    'supplier' => $row[6] ?? '',
                    'kit_alias' => $row[7] ?? '',
                    'pat_class' => $row[8] ?? '',
                    'pat_vi_socket' => $row[9] ? true : false,
                    'pat_vi_plug' => $row[9] ? true : false,
                    'pat_vi_switch' => $row[9] ? true : false,
                    'pat_vi_flex' => $row[9] ? true : false,
                    'pat_vi_body' => $row[9] ? true : false,
                    'pat_vi_environment' => $row[9] ? true : false,
                    'pat_vi_continued_use' => $row[9] ? true : false,
                    'pat_ins_resis' => $row[10] ?? '',
                    'pat_earth_cont' => $row[11] ?? '',
                    'pat_leakage' => $row[12] ?? '',
                    'pat_continuity' => $row[13] ?? '',
                    'pat_result' => in_array(strtoupper($row[14]), ['PASSED', 'PASS', 'Y']) ? 'Pass' : 'Fail',
                ];

                try {
                    // Check for existing asset with same alias and retire it if found
                    $existingAssetByAlias = null;
                    if (!empty($data['alias'])) {
                        $existingAssetByAlias = Asset::where('alias', trim($data['alias']))
                                                    ->where('status', '!=', 'Retired')
                                                    ->first();
                        
                        if ($existingAssetByAlias) {
                            // Retire the old asset
                            $existingAssetByAlias->update(['status' => 'Retired']);
                            
                            // Remove from any kits
                            $this->removeAssetFromAllKits($existingAssetByAlias);
                            
                            $results['retired'][] = [
                                'id' => $existingAssetByAlias->id,
                                'alias' => $existingAssetByAlias->alias,
                                'afs_id' => $existingAssetByAlias->afs_id
                            ];
                        }
                    }

                    // Process asset data
                    $assetData = [
                        'afs_id' => !empty($data['afs_id']) ? trim($data['afs_id']) : null,
                        'alias' => !empty($data['alias']) ? trim($data['alias']) : null,
                        'type' => trim($data['type']),
                        'make' => !empty($data['make']) ? trim($data['make']) : null,
                        'model' => !empty($data['model']) ? trim($data['model']) : null,
                        'status' => !empty($data['status']) ? trim($data['status']) : 'Active',
                        'acq_date' => !empty($data['acq_date']) ? trim($data['acq_date']) : null,
                        'supplier' => !empty($data['supplier']) ? trim($data['supplier']) : null,
                    ];

                    // Check if asset exists (by afs_id if provided)
                    $existingAsset = null;
                    if ($assetData['afs_id']) {
                        $existingAsset = Asset::where('afs_id', $assetData['afs_id'])->first();
                    }

                    if ($existingAsset) {
                        // Update existing asset
                        $existingAsset->update($assetData);
                        $asset = $existingAsset;
                        $results['updated']++;
                    } else {
                        // Create new asset
                        $asset = Asset::create($assetData);
                        $results['created']++;
                    }

                    // Process PAT test data if provided
                    $this->processPATTestData($asset, $data, $rowNumber, $results);

                    // Process kit assignment if provided
                    $this->processKitAssignment($asset, $data, $results);

                } catch (\Exception $e) {
                    $results['errors'][] = "Row {$rowNumber}: " . $e->getMessage();
                    continue;
                }
            }

            DB::commit();

            Auditing::log('Asset Management', auth()->user()->id, 'Batch Import', 
                "Imported assets - Created: {$results['created']}, Updated: {$results['updated']}, Errors: " . count($results['errors']));

            Log::debug('Asset batch import completed: ' . json_encode($results));

            return response()->json([
                'message' => 'Batch import completed',
                'results' => $results
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Asset batch import failed: ' . $e->getMessage());
            return response()->json(['message' => 'Batch import failed: ' . $e->getMessage()], 500);
        }
    }

    private function processPATTestData($asset, $data, $rowNumber, &$results)
    {
        // Check if any PAT test data is provided
        $patFields = ['pat_class', 'pat_vi_socket', 'pat_vi_plug', 'pat_vi_switch', 'pat_vi_flex', 
                     'pat_vi_body', 'pat_vi_environment', 'pat_vi_continued_use', 'pat_ins_resis', 
                     'pat_earth_cont', 'pat_leakage', 'pat_continuity', 'pat_result'];
        
        $hasPATData = false;
        foreach ($patFields as $field) {
            if (!empty($data[$field])) {
                $hasPATData = true;
                break;
            }
        }

        if (!$hasPATData) {
            return; // No PAT data to process
        }

        try {
            $patData = [
                'asset_id' => $asset->id,
                'datetime' => now(),
                'expires' => now()->addYear(),
                'user_id' => auth()->user()->id,
                'hr_id' => auth()->user()->employee->hr_id ?? null,
                'class' => !empty($data['pat_class']) ? trim($data['pat_class']) : null,
                'vi_socket' => $this->parseBooleanValue($data['pat_vi_socket']),
                'vi_plug' => $this->parseBooleanValue($data['pat_vi_plug']),
                'vi_switch' => $this->parseBooleanValue($data['pat_vi_switch']),
                'vi_flex' => $this->parseBooleanValue($data['pat_vi_flex']),
                'vi_body' => $this->parseBooleanValue($data['pat_vi_body']),
                'vi_environment' => $this->parseBooleanValue($data['pat_vi_environment']),
                'vi_continued_use' => $this->parseBooleanValue($data['pat_vi_continued_use']),
                'ins_resis' => !empty($data['pat_ins_resis']) ? floatval($data['pat_ins_resis']) : null,
                'earth_cont' => !empty($data['pat_earth_cont']) ? floatval($data['pat_earth_cont']) : null,
                'leakage' => !empty($data['pat_leakage']) ? floatval($data['pat_leakage']) : null,
                'continuity' => !empty($data['pat_continuity']) ? floatval($data['pat_continuity']) : null,
                'result' => !empty($data['pat_result']) ? trim($data['pat_result']) : 'Pass',
            ];

            PAT::create($patData);

        } catch (\Exception $e) {
            $results['errors'][] = "Row {$rowNumber}: PAT test creation failed - " . $e->getMessage();
        }
    }

    private function processKitAssignment($asset, $data, &$results)
    {
        if (empty($data['kit_alias'])) {
            return; // No kit assignment requested
        }

        $kitAlias = trim($data['kit_alias']);

        try {
            // Check if kit exists
            $kit = Kit::where('alias', $kitAlias)->first();

            if (!$kit) {
                // Create new kit
                $kit = Kit::create([
                    'alias' => $kitAlias,
                    'active' => true
                ]);
                $results['kits_created'][] = $kitAlias;
            }

            // Check if asset is already in a different kit and remove it
            $currentKitItem = Item::where('asset_id', $asset->id)->first();
            if ($currentKitItem && $currentKitItem->kit_id !== $kit->id) {
                // Remove from current kit
                $this->removeAssetFromKit($asset->id, $currentKitItem->kit_id);
            }

            // Check if asset is already in this kit
            $existingItem = Item::where('kit_id', $kit->id)
                               ->where('asset_id', $asset->id)
                               ->first();

            if (!$existingItem) {
                // Add asset to kit
                Item::create([
                    'kit_id' => $kit->id,
                    'asset_id' => $asset->id,
                ]);

                // Log the kit assignment
                DB::table('assets.kit_log')->insert([
                    'kit_id' => $kit->id,
                    'asset_id' => $asset->id,
                    'type' => 'Added',
                    'user_id' => auth()->user()->id,
                    'hr_id' => auth()->user()->employee->hr_id ?? null,
                    'created_at' => now(),
                ]);
            }

            // Add generic items to kit if applicable.
            $this->addGenericItemsToKit($asset, $kit, $results);

        } catch (\Exception $e) {
            $results['errors'][] = "Kit assignment failed for asset {$asset->id}: " . $e->getMessage();
        }
    }

    private function addGenericItemsToKit($asset, $kit, &$results)
    {
        // Define generic items to add (by asset ID)
        $generic_items = [1, 2, 3, 4, 1124];

        foreach ($generic_items as $item) {

            // Check if item is already in kit.
            $existingItem = Item::where('kit_id', $kit->id)
            ->where('asset_id', $item)
            ->first();

            // Skip if already exists.
            if($existingItem)
                continue;
                
            Item::create([
                'kit_id' => $kit->id,
                'asset_id' => $item,
            ]);

            DB::table('assets.kit_log')->insert([
                'kit_id' => $kit->id,
                'asset_id' => $item,
                'type' => 'Added',
                'user_id' => auth()->user()->id,
                'hr_id' => auth()->user()->employee->hr_id,
                'created_at' => now(),
            ]);
        }

        $results['generic_items_added'][] = [
            'kit_alias' => $kit->alias,
            'asset_alias' => $asset->alias,
            'items_added' => $generic_items
        ];
    }

    private function parseBooleanValue($value)
    {
        if (empty($value)) {
            return false;
        }
        
        $value = strtolower(trim($value));
        return in_array($value, ['true', '1', 'yes', 'pass', 'passed']);
    }

    private function removeAssetFromAllKits($asset)
    {
        $kitItems = Item::where('asset_id', $asset->id)->get();
        
        foreach ($kitItems as $item) {
            $this->removeAssetFromKit($asset->id, $item->kit_id);
        }
    }

    private function removeAssetFromKit($assetId, $kitId)
    {
        // Remove from kit
        Item::where('asset_id', $assetId)
             ->where('kit_id', $kitId)
             ->delete();

        // Log the removal
        DB::table('assets.kit_log')->insert([
            'kit_id' => $kitId,
            'asset_id' => $assetId,
            'type' => 'Removed',
            'user_id' => auth()->user()->id,
            'hr_id' => auth()->user()->employee->hr_id ?? null,
            'created_at' => now(),
        ]);
    }

    private function previewAssetChanges($data, $rowNumber, &$preview)
    {
        $assetData = [
            'afs_id' => !empty($data['afs_id']) ? trim($data['afs_id']) : null,
            'alias' => !empty($data['alias']) ? trim($data['alias']) : null,
            'type' => trim($data['type']),
            'make' => !empty($data['make']) ? trim($data['make']) : null,
            'model' => !empty($data['model']) ? trim($data['model']) : null,
            'status' => !empty($data['status']) ? trim($data['status']) : 'Active',
            'acq_date' => !empty($data['acq_date']) ? trim($data['acq_date']) : null,
            'supplier' => !empty($data['supplier']) ? trim($data['supplier']) : null,
        ];

        // Check for existing asset with same alias
        if (!empty($assetData['alias'])) {
            $existingAssetByAlias = Asset::where('alias', $assetData['alias'])
                                        ->where('status', '!=', 'Retired')
                                        ->first();
            
            if ($existingAssetByAlias) {
                $kits = Item::where('asset_id', $existingAssetByAlias->id)
                           ->with('kit')
                           ->get()
                           ->pluck('kit.alias')
                           ->toArray();

                $preview['assets_to_retire'][] = [
                    'row' => $rowNumber,
                    'id' => $existingAssetByAlias->id,
                    'alias' => $existingAssetByAlias->alias,
                    'afs_id' => $existingAssetByAlias->afs_id,
                    'type' => $existingAssetByAlias->type,
                    'current_kits' => $kits
                ];
            }
        }

        // Check if asset exists (by afs_id)
        $existingAsset = null;
        if ($assetData['afs_id']) {
            $existingAsset = Asset::where('afs_id', $assetData['afs_id'])->first();
        }

        if ($existingAsset && !isset($existingAssetByAlias)) {
            $preview['assets_to_update'][] = [
                'row' => $rowNumber,
                'id' => $existingAsset->id,
                'current_data' => $existingAsset->toArray(),
                'new_data' => $assetData
            ];
        } else {
            $preview['assets_to_create'][] = [
                'row' => $rowNumber,
                'data' => $assetData
            ];
        }
    }

    private function previewPATTestChanges($data, $rowNumber, &$preview)
    {
        $patFields = ['pat_class', 'pat_vi_socket', 'pat_vi_plug', 'pat_vi_switch', 'pat_vi_flex', 
                     'pat_vi_body', 'pat_vi_environment', 'pat_vi_continued_use', 'pat_ins_resis', 
                     'pat_earth_cont', 'pat_leakage', 'pat_continuity', 'pat_result'];
        
        $hasPATData = false;
        foreach ($patFields as $field) {
            if (!empty($data[$field])) {
                $hasPATData = true;
                break;
            }
        }

        if ($hasPATData) {
            $preview['pat_tests_to_create'][] = [
                'row' => $rowNumber,
                'asset_alias' => $data['alias'],
                'pat_data' => array_filter([
                    'class' => $data['pat_class'],
                    'result' => $data['pat_result'] ?: 'pass',
                ])
            ];
        }
    }

    private function previewKitChanges($data, $rowNumber, &$preview)
    {
        if (empty($data['kit_alias'])) {
            return;
        }

        $kitAlias = trim($data['kit_alias']);
        $assetAlias = trim($data['alias']);

        // Check if kit exists
        $kit = Kit::where('alias', $kitAlias)->first();
        $kitExists = $kit ? true : false;

        // Check current kit assignment for this asset alias
        $currentKitAssignment = null;
        if (!empty($assetAlias)) {
            $asset = Asset::where('alias', $assetAlias)->first();
            if ($asset) {
                $currentItem = Item::where('asset_id', $asset->id)->with('kit')->first();
                if ($currentItem) {
                    $currentKitAssignment = $currentItem->kit->alias;
                }
            }
        }

        $preview['kit_changes'][] = [
            'row' => $rowNumber,
            'asset_alias' => $assetAlias,
            'target_kit' => $kitAlias,
            'kit_exists' => $kitExists,
            'current_kit' => $currentKitAssignment,
            'action' => $currentKitAssignment && $currentKitAssignment !== $kitAlias ? 'reassign' : 'assign'
        ];
    }
}
