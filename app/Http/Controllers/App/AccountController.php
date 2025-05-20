<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employee\Employee;
use App\Models\User\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class AccountController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth']);
        $this->middleware(['has.permission:pulse_view_account']);
        $this->middleware(['log.access']);
    }

    public function profile(){
        $user = User::find(auth()->user()->id);
        $employee = Employee::where('user_id',auth()->user()->id)->first();

        return Inertia::render('Account/Profile', [
            'employee' => $employee,
            'user' => $user,
        ]);
    }

    public function setProfilePhoto(Request $request){
        $user = Employee::where('user_id', auth()->user()->id)->first();

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
    
        // Generate a unique filename
        $fileName = uniqid('profile_') . '.' . $type;
        $filePath = 'profile/images/' . $fileName;
    
        // Store the image (local disk, change to 'r2' if needed)
        \Storage::disk('r2')->put($filePath, $data);
    
        // Save the filename/path to the employee
        $user->profile_photo = $fileName;
        $user->save();
    
        return response()->json(['message' => 'Profile photo updated.', 'file' => $fileName]);
    }

    public function index($page){
        $employee = Employee::where('user_id',auth()->user()->id)->first();

        switch ($page) {
            case 'medical-conditions':
                $page = 2;
                break;
            case 'next-of-kin':
                $page = 3;
                break;
            case 'your-bank-details':
                $page = 4;
                break;
            case 'tax-information':
                $page = 5;
                break;
            case 'student-loan-questionaire':
                    $page = 6;
                    break;
            default:
                $page = 1;
                break;
        }
        
        return Inertia::render('Account/AccountForm', [
            'employee' => $employee,
            'initialPage' => $page,
        ]);

        // if(!HR::find(auth()->user()->id)->only('complete')){
        // }else{
        //     return Inertia::render('HR/MyDetails');
        // }       
    }

    public function information(Request $request){
        $hrId = $request->query('hr_id');

        $employee = Employee::where('hr_id', $hrId)->leftJoin('wings_config.users', 'hr_details.user_id', '=', 'users.id')->first();

        return response()->json($employee);
    }

    public function saveData(Request $request, $page){
        $employee = Employee::find(auth()->user()->id);
        $employee->update($request->all());
        return redirect()->back();
    }

    public function profilePhoto(Request $request){
        $userId = $request->query('userId');
        $user = User::find($userId);

        return $user ? response()->json($user->profile_photo) : null ;
    }

    public function activateState(Request $request){
        $userId = $request->query('userId');
        $user = User::find($userId);

        return $user ? response()->json(1) : null ;
    }
}
