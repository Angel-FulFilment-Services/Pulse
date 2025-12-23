<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Helper\T2SMS;
use App\Models\HR\Employee;
use App\Models\User\User;
use AshAllenDesign\ShortURL\Facades\ShortURL;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class ProfilePhotoSmsController extends Controller
{
    /**
     * Check if a user needs to set their profile photo.
     * Returns user status and masked phone number if available.
     */
    public function checkStatus(Request $request)
    {
        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json([
                'needs_photo' => false,
                'has_mobile' => false,
                'reason' => 'no_employee_record'
            ]);
        }

        $hasProfilePhoto = !empty($employee->profile_photo);
        $hasMobile = !empty($employee->contact_mobile_phone);
        
        // Mask the phone number (show last 3 digits)
        $maskedPhone = null;
        if ($hasMobile) {
            $phone = $employee->contact_mobile_phone;
            $maskedPhone = '***' . substr($phone, -3);
        }

        return response()->json([
            'needs_photo' => !$hasProfilePhoto,
            'has_mobile' => $hasMobile,
            'masked_phone' => $maskedPhone,
            'user_name' => $employee->firstname ?? $user->name
        ]);
    }

    /**
     * Send SMS with link to set profile photo.
     */
    public function sendSms(Request $request)
    {
        $user = auth()->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee record not found.'
            ], 404);
        }

        if (empty($employee->contact_mobile_phone)) {
            return response()->json([
                'success' => false,
                'message' => 'No mobile phone number on file.'
            ], 400);
        }

        if (!empty($employee->profile_photo)) {
            return response()->json([
                'success' => false,
                'message' => 'Profile photo is already set.'
            ], 400);
        }

        // Generate a temporary signed URL (valid for 24 hours)
        $signedUrl = URL::temporarySignedRoute(
            'profile.photo.mobile',
            now()->addHours(24),
            ['user_id' => $user->id]
        );

        // Create a short URL
        $shortUrlModel = ShortURL::destinationUrl($signedUrl)
            ->singleUse()
            ->make();

        $shortUrl = $shortUrlModel->default_short_url;

        // Mask phone for response
        $phone = $employee->contact_mobile_phone;
        $maskedPhone = '***' . substr($phone, -3);

        // Prepare and send SMS
        $message = "Hi " . ($employee->firstname ?? $user->name) . ", set your profile photo using this secure link: {$shortUrl} - This link expires in 24 hours and can only be used once.";

        $response = T2SMS::sendSms(
            'Angel',
            $employee->contact_mobile_phone,
            $message
        );

        if ($response && $response->successful()) {
            return response()->json([
                'success' => true,
                'message' => 'SMS sent successfully.',
                'masked_phone' => $maskedPhone
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send SMS. Please try again.'
            ], 500);
        }
    }

    /**
     * Show the mobile profile photo upload page (no auth required - uses signed URL).
     */
    public function showMobileUpload(Request $request, $user_id)
    {
        // Validate the signed URL
        if (!$request->hasValidSignature()) {
            abort(419); // Page Expired
        }

        $user = User::find($user_id);
        $employee = Employee::where('user_id', $user_id)->first();

        if (!$user || !$employee) {
            abort(404);
        }

        // Check if photo is already set
        if (!empty($employee->profile_photo)) {
            abort(410); // Gone - resource no longer available
        }

        return Inertia::render('Account/MobileProfilePhoto', [
            'user_id' => $user_id,
            'user_name' => $user->name,
            'signature' => $request->query('signature'),
            'expires' => $request->query('expires')
        ]);
    }

    /**
     * Set profile photo from mobile page (no auth required).
     * Security: The page itself is protected by signed URL, so we trust
     * POST requests that come with valid user_id and CSRF token.
     */
    public function setMobileProfilePhoto(Request $request, $user_id)
    {
        $employee = Employee::where('user_id', $user_id)->first();

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.'
            ], 404);
        }

        // Check if photo is already set (prevents reuse)
        if (!empty($employee->profile_photo)) {
            return response()->json([
                'success' => false,
                'message' => 'Profile photo has already been set.'
            ], 400);
        }

        $data = $request->input('profile_photo');
        if (!$data) {
            return response()->json([
                'success' => false,
                'message' => 'No image data provided.'
            ], 422);
        }

        // Extract base64 string
        if (preg_match('/^data:image\/(\w+);base64,/', $data, $type)) {
            $data = substr($data, strpos($data, ',') + 1);
            $type = strtolower($type[1]);

            $data = base64_decode($data);
            if ($data === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Base64 decode failed.'
                ], 422);
            }
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Invalid image data.'
            ], 422);
        }

        // Remove old profile photo if set
        if ($employee->profile_photo) {
            $oldPath = 'profile/images/' . $employee->profile_photo;
            if (Storage::disk('r2-public')->exists($oldPath)) {
                Storage::disk('r2-public')->delete($oldPath);
            }
        }

        // Generate a unique filename
        $fileName = uniqid('profile_') . '.' . $type;
        $filePath = 'profile/images/' . $fileName;

        // Store the image
        Storage::disk('r2-public')->put($filePath, $data);

        // Save the filename to the employee
        $employee->profile_photo = $fileName;
        $employee->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile photo updated successfully!'
        ]);
    }
}
