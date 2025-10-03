<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Helper\Auditing;
use App\Models\Rota\Shift;
use App\Models\HR\Employee;
use App\Models\Rota\Event;
use App\Models\HR\Meeting;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Log;

class RotaController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['has.permission:pulse_view_rota']);
        $this->middleware(['log.access']);
    }

    public function index(){
        return Inertia::render('Rota/Rota');
    }

    public function shifts(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));
        $hrId = $request->query('hr_id');

        // Fetch shifts for the date range
        $shifts = Shift::whereBetween('shiftdate', [$startDate, $endDate])
        ->select("shifts2.*")
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('shifts2.hr_id', $hrId);
        })
        ->groupBy('hr_id','shiftdate','shiftstart','shiftend')
        ->get();

        return response()->json($shifts);
    }

    public function timesheets(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));
        $hrId = $request->query('hr_id');

        // Fetch timesheet_today records for the date range
        if((date('Y-m-d') >= $startDate) && (date('Y-m-d') <= $endDate)){
            $timesheetToday = DB::table('apex_data.timesheet_today')
                ->whereBetween('date', [$startDate, $endDate])
                ->whereNotIn('category', ['Holiday'])
                ->where('hr_id', '<>', '9999')
                ->when($hrId, function ($query) use ($hrId) {
                    return $query->where('hr_id', $hrId);
                })
                ->get()
                ->map(function ($record) {
                    if (is_null($record->off_time)) {
                        $record->off_time = Carbon::now();
                    }
                    return $record;
                });
        }

        // Fetch timesheet_master records for the date range
        $timesheetMaster = DB::table('apex_data.timesheet_master')
            ->whereNotIn('category', ['Holiday'])
            ->where('hr_id', '<>', '9999')
            ->whereBetween('date', [$startDate, $endDate])
            ->when($hrId, function ($query) use ($hrId) {
                return $query->where('hr_id', $hrId);
            })
            ->get();

        // Merge timesheet_today and timesheet_master records
        $timesheets = isset($timesheetToday) ? $timesheetToday->merge($timesheetMaster) : $timesheetMaster;

        // Fetch breaksheet records for the date range        
        $breaksheetMaster = DB::table('apex_data.breaksheet_master')
        ->whereBetween('date', [$startDate, $endDate])
        ->where('nosync_deleted', 0)
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('hr_id', $hrId);
        })
        ->get();

        // Merge breaksheet records with timesheets
        $timesheets = isset($breaksheetMaster) ? $timesheets->merge($breaksheetMaster) : $timesheets;

        return response()->json($timesheets);
    }

    public function events(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));
        $hrId = $request->query('hr_id');

        // Fetch event records for the date range
        $events = Event::whereBetween('on_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->select('events.*')
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('events.hr_id', $hrId)
            ->leftJoin('wings_config.users', 'users.id', '=', 'events.created_by_user_id')
            ->addSelect('users.name as logged_by');
        })
        ->get();

        return response()->json($events);
    }

    public function calls(Request $request){
        $startDate = date("Y-m-d", strtotime($request->query('start_date')));
        $endDate = date("Y-m-d", strtotime($request->query('end_date')));
        $hrId = $request->query('hr_id');

        $calls = DB::connection("apex_data")
        ->table("apex_data")
        ->whereBetween('date', [$startDate, $endDate])
        ->where(function($query){
            $query->where('apex_data.answered','=','1');
            $query->orWhere('apex_data.type','<>','Queue');
        })
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('hr_id', $hrId);
        })
        ->select('apex_data.hr_id', 'apex_data.date_time', 'apex_data.ddi', DB::raw('IF(apex_data.type <> "Queue", apex_data.ring_time + apex_data.calltime, apex_data.calltime) as time'))
        ->get();

        $callMonitoring = DB::table('call_monitoring.cm_log')
        ->leftJoin('wings_data.hr_details', 'cm_log.user_id', '=', 'hr_details.user_id')
        ->whereBetween('started_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
        ->when($hrId, function ($query) use ($hrId) {
            return $query->where('hr_details.hr_id', $hrId);
        })
        ->select('hr_details.hr_id', 'cm_log.started_at as date_time', DB::raw('TIMESTAMPDIFF(SECOND, cm_log.started_at, cm_log.ended_at) as time'))
        ->get();

        $calls = isset($callMonitoring) ? $calls->merge($callMonitoring) : $calls;

        return response()->json($calls);
    }

    public function saveEvent(Request $request)
    {
    // Define validation rules
        $rules = [
            'flagType' => 'required|string',
            // 'requiresAction' => 'required|boolean',
            'meetingDate' => 'nullable|date',
            'startTime.hour' => 'required|string|regex:/^\d{2}$/',
            'startTime.minute' => 'required|string|regex:/^\d{2}$/',
            'endTime.hour' => 'required|string|regex:/^\d{2}$/',
            'endTime.minute' => 'required|string|regex:/^\d{2}$/',
            'notes' => 'nullable|string|max:500',
        ];

        // Define custom validation messages
        $messages = [
            'flagType.required' => 'Please select a flag type.',
            'flagType.string' => 'The flag type must be a valid string.',
            // 'requiresAction.required' => 'Please specify if action is required.',
            // 'requiresAction.boolean' => 'The action required field must be true or false.',
            'startTime.hour.required' => 'Please select an hour.',
            'startTime.hour.regex' => 'The hour must be a 2-digit value (e.g., "08").',
            'startTime.minute.required' => 'Please select a minute.',
            'startTime.minute.regex' => 'The minute must be a 2-digit value (e.g., "30").',
            'endTime.hour.required' => 'Please select an hour.',
            'endTime.hour.regex' => 'The hour must be a 2-digit value (e.g., "08").',
            'endTime.minute.required' => 'Please select a minute.',
            'endTime.minute.regex' => 'The minute must be a 2-digit value (e.g., "30").',
            'notes.string' => 'The notes must be a valid string.',
            'notes.max' => 'The notes must not exceed 500 characters.',
        ];

        try {
            $request->validate($rules, $messages);



            // Validate that an event hasn't been created between this time period for this user already.
            $existingEvent = Event::where('hr_id', $request->hrID)
                ->whereDate('date', date("Y-m-d", strtotime($request->date)))
                ->where(function ($query) use ($request) {
                    $query->whereBetween(DB::raw("TIME(on_time)"), [$request->startTime['hour'] . ':' . $request->startTime['minute'] . ':00', $request->endTime['hour'] . ':' . $request->endTime['minute'] . ':00'])
                          ->orWhereBetween(DB::raw("TIME(off_time)"), [$request->startTime['hour'] . ':' . $request->startTime['minute'] . ':00', $request->endTime['hour'] . ':' . $request->endTime['minute'] . ':00'])
                          ->orWhere(function ($q) use ($request) {
                              $q->where(DB::raw("TIME(on_time)"), '<=', $request->startTime['hour'] . ':' . $request->startTime['minute'] . ':00')
                                ->where(DB::raw("TIME(off_time)"), '>=', $request->endTime['hour'] . ':' . $request->endTime['minute'] . ':00');
                          });
                })
                ->when($request->eventID, function ($query) use ($request) {
                    return $query->where('id', '<>', $request->eventID);
                })
                ->first();

            if ($existingEvent) {
                return response()->json(['message' => 'An event already exists for this user during the specified time period.'], 422);
            }  

            // // Add conditional validation for meetingTime if requiresAction is true
            // if ($request->requiresAction) {
            //     $request->validate([
            //         'meetingDate' => 'required|date',
            //         'meetingTime.hour' => 'required|string|regex:/^\d{2}$/',
            //         'meetingTime.minute' => 'required|string|regex:/^\d{2}$/',
            //     ], [
            //         'meetingDate.required' => 'Meeting date is required when action is required.',
            //         'meetingTime.hour.required' => 'Meeting hour is required when action is required.',
            //         'meetingTime.minute.required' => 'Meeting minute is required when action is required.',
            //     ]);
            // }

            $user = Employee::where('hr_id', '=', $request->hrID)->first();


            // Process the validated data
            if ($request->eventID){
                Event::find($request->eventID)->update([
                    'hr_id' => $request->hrID,
                    // 'shift_id' => $request->shiftID,
                    'user_id' => $user->user_id,
                    'created_by_user_id' => auth()->user()->id,
                    'date' => date("Y-m-d", strtotime($request->date)),
                    'on_time' => date("Y-m-d", strtotime($request->date)) . ' ' . $request->startTime['hour'] . ':' . $request->startTime['minute'] . ':00',
                    'off_time' => date("Y-m-d", strtotime($request->date)) . ' ' . $request->endTime['hour'] . ':' . $request->endTime['minute'] . ':00',
                    'requires_action' => false,
                    'category' => $request->flagType,
                    'notes' => $request->notes,
                ]);

                Auditing::log('Event', auth()->user()->id, 'Event Updated', 'Event ID: ' . $request->eventID);
            }else{
                $event = Event::create([
                    'hr_id' => $request->hrID,
                    // 'shift_id' => $request->shiftID,
                    'user_id' => $user->user_id,
                    'created_by_user_id' => auth()->user()->id,
                    'date' => date("Y-m-d", strtotime($request->date)),
                    'on_time' => date("Y-m-d", strtotime($request->date)) . ' ' . $request->startTime['hour'] . ':' . $request->startTime['minute'] . ':00',
                    'off_time' => date("Y-m-d", strtotime($request->date)) . ' ' . $request->endTime['hour'] . ':' . $request->endTime['minute'] . ':00',
                    'category' => $request->flagType,
                    'notes' => $request->notes,
                ]);

                Auditing::log('Event', auth()->user()->id, 'Event Created', 'Event ID: ' . $event->id);
            }

            // if ($request->requiresAction) {
            //     Meeting::create([
            //         'hr_id' => $request->hrID,
            //         'user_id' => $user->user_id,
            //         // 'shift_id' => $request->shiftID,
            //         'created_by_user_id' => auth()->user()->id,
            //         'title' => 'Absence Action Required',
            //         'description' => 'Action required for absence event on ' . date('Y-m-d', strtotime($request->date)),
            //         'meeting_datetime' => date("Y-m-d", strtotime($request->meetingDate)) . ' ' . $request->meetingTime['hour'] . ':' . $request->meetingTime['minute'] . ':00',
            //     ]);
            // }

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

    public function removeEvent(Request $request)
    {
        // Define validation rules
        $rules = [
            'eventId' => 'required|numeric',
        ];

        try {
            $event = Event::find($request->eventId);

            if($event && $event->delete()){
                Auditing::log('Event', auth()->user()->id, 'Event Deleted', 'Event ID: ' . $request->eventId);
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

    public function removeBreak(Request $request)
    {
        // Define validation rules
        $rules = [
            'eventId' => 'required|numeric',
        ];
        try {
            if(DB::table('apex_data.breaksheet_master')->where('unq_id', $request->eventId)->update(['nosync_deleted' => 1])){
                Auditing::log('Break', auth()->user()->id, 'Break Deleted', 'Break ID: ' . $request->eventId);
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
}
