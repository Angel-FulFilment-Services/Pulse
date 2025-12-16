<?php

namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\MessageAttachment;
use App\Services\Chat\AttachmentService;
use Illuminate\Support\Facades\Validator;

class AttachmentController extends Controller
{
    protected $attachmentService;
    
    public function __construct(AttachmentService $attachmentService)
    {
        $this->attachmentService = $attachmentService;
    }
    
    /**
     * Upload attachments (can be called before message is sent)
     */
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'files' => 'required|array|max:10',
            'files.*' => 'required|file|max:10240', // 10MB in KB
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $files = $request->file('files');
        
        // Validate total size and count
        $totalErrors = $this->attachmentService->validateTotalSize($files);
        if (!empty($totalErrors)) {
            return response()->json(['errors' => $totalErrors], 422);
        }
        
        $uploadedAttachments = [];
        $errors = [];
        
        foreach ($files as $index => $file) {
            // Validate individual file
            $fileErrors = $this->attachmentService->validateFile($file);
            if (!empty($fileErrors)) {
                $errors["file_{$index}"] = $fileErrors;
                continue;
            }
            
            try {
                $attachmentData = $this->attachmentService->uploadAttachment($file, $request->user()->id);
                $uploadedAttachments[] = $attachmentData;
            } catch (\Exception $e) {
                \Log::error('Attachment upload failed: ' . $e->getMessage());
                $errors["file_{$index}"] = ['Upload failed: ' . $e->getMessage()];
            }
        }
        
        if (!empty($errors) && empty($uploadedAttachments)) {
            return response()->json(['errors' => $errors], 500);
        }
        
        return response()->json([
            'attachments' => $uploadedAttachments,
            'errors' => $errors
        ], 200);
    }
    
    /**
     * Attach uploaded files to a message
     */
    public function attachToMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message_id' => 'required|integer|exists:pulse.messages,id',
            'attachments' => 'required|array',
            'attachments.*.file_name' => 'required|string',
            'attachments.*.file_type' => 'required|string',
            'attachments.*.file_size' => 'required|integer',
            'attachments.*.mime_type' => 'required|string',
            'attachments.*.storage_path' => 'required|string',
            'attachments.*.storage_driver' => 'required|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $attachments = [];
        
        foreach ($request->input('attachments') as $attachmentData) {
            $attachment = MessageAttachment::create([
                'message_id' => $request->input('message_id'),
                'file_name' => $attachmentData['file_name'],
                'file_type' => $attachmentData['file_type'],
                'file_size' => $attachmentData['file_size'],
                'mime_type' => $attachmentData['mime_type'],
                'storage_path' => $attachmentData['storage_path'],
                'thumbnail_path' => $attachmentData['thumbnail_path'] ?? null,
                'is_image' => $attachmentData['is_image'] ?? false,
                'storage_driver' => $attachmentData['storage_driver'],
            ]);
            
            $attachments[] = $attachment;
        }
        
        return response()->json(['attachments' => $attachments], 201);
    }
    
    /**
     * Proxy endpoint to serve files with authentication
     */
    public function proxy(Request $request, $id)
    {
        try {
            $attachment = MessageAttachment::with(['message', 'message.team'])->findOrFail($id);
            
            // Check if user has access to this attachment
            $message = $attachment->message;
            
            if (!$message) {
                \Log::error('Attachment has no associated message', ['attachment_id' => $id]);
                abort(404, 'Message not found');
            }
            
            $userId = $request->user()->id;
            
            // Check if user is part of the conversation
            $hasAccess = false;
            if ($message->team_id) {
                // Check team membership - use DB query since Team model doesn't have members relationship
                if (!$message->team) {
                    \Log::error('Team not found for message', [
                        'message_id' => $message->id,
                        'team_id' => $message->team_id
                    ]);
                    abort(404, 'Team not found');
                }
                
                // Check if user is an active member of the team (not left)
                $hasAccess = \DB::connection('pulse')->table('team_user')
                    ->where('team_id', $message->team_id)
                    ->where('user_id', $userId)
                    ->whereNull('left_at')
                    ->exists();
            } else {
                // Check if user is sender or recipient
                $hasAccess = ($message->sender_id === $userId || $message->recipient_id === $userId);
            }
            
            if (!$hasAccess) {
                \Log::warning('User unauthorized to access attachment', [
                    'user_id' => $userId,
                    'attachment_id' => $id,
                    'message_id' => $message->id,
                    'team_id' => $message->team_id
                ]);
                abort(403, 'Unauthorized');
            }
            
            // Determine which file to serve
            $isThumbnail = $request->has('thumbnail') && $attachment->thumbnail_path;
            $storagePath = $isThumbnail ? $attachment->thumbnail_path : $attachment->storage_path;
            
            \Log::info('Serving attachment', [
                'attachment_id' => $id,
                'is_thumbnail' => $isThumbnail,
                'storage_path' => $storagePath,
                'storage_driver' => $attachment->storage_driver
            ]);
            
            // Get file from storage
            $fileContent = $this->attachmentService->getFile($storagePath, $attachment->storage_driver);
            
            if (!$fileContent) {
                \Log::error('File not found in storage', [
                    'attachment_id' => $id,
                    'storage_path' => $storagePath,
                    'driver' => $attachment->storage_driver
                ]);
                abort(404, 'File not found');
            }
            
            // Set appropriate headers
            $mimeType = $isThumbnail ? 'image/webp' : $attachment->mime_type;
            
            return response($fileContent, 200)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'inline; filename="' . $attachment->file_name . '"')
                ->header('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
                ->header('Expires', gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
        } catch (\Exception $e) {
            \Log::error('Attachment proxy error', [
                'attachment_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            abort(500, 'Error serving attachment: ' . $e->getMessage());
        }
    }
    
    /**
     * Download attachment
     */
    public function download(Request $request, $id)
    {
        $attachment = MessageAttachment::findOrFail($id);
        
        // Check if user has access
        $message = $attachment->message;
        $userId = $request->user()->id;
        
        $hasAccess = false;
        if ($message->team_id) {
            $hasAccess = $message->team->members()->where('user_id', $userId)->exists();
        } else {
            $hasAccess = ($message->sender_id === $userId || $message->recipient_id === $userId);
        }
        
        if (!$hasAccess) {
            abort(403, 'Unauthorized');
        }
        
        // Get file from storage
        $fileContent = $this->attachmentService->getFile($attachment->storage_path, $attachment->storage_driver);
        
        if (!$fileContent) {
            abort(404, 'File not found');
        }
        
        return response($fileContent, 200)
            ->header('Content-Type', $attachment->mime_type)
            ->header('Content-Disposition', 'attachment; filename="' . $attachment->file_name . '"');
    }
    
    /**
     * Delete attachment
     */
    public function delete(Request $request, $id)
    {
        $attachment = MessageAttachment::findOrFail($id);
        
        // Check if user is the message sender
        $message = $attachment->message;
        if ($message->sender_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }
        
        // Delete from storage
        $this->attachmentService->deleteAttachment(
            $attachment->storage_path,
            $attachment->thumbnail_path,
            $attachment->storage_driver
        );
        
        // Delete from database
        $attachment->delete();
        
        return response()->json(['message' => 'Attachment deleted'], 200);
    }
}
