<?php
namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\Message;
use App\Models\Chat\MessageReaction;
use App\Models\Chat\MessageAttachment;
use App\Models\Chat\Team;
use App\Models\Chat\DmPinnedMessage;
use App\Events\Chat\MessageSent;
use App\Models\User\User;

class MessageController extends Controller
{
    // Search messages by keyword in team or direct chat
    public function search(Request $request)
    {
        $q = $request->input('q');
        $teamId = $request->input('team_id');
        $recipientId = $request->input('recipient_id');
        $query = Message::query();
        if ($teamId) {
            $query->where('team_id', $teamId);
        } elseif ($recipientId) {
            $userId = auth()->user()->id;
            $query->where(function($q2) use ($userId, $recipientId) {
                $q2->where('sender_id', $userId)->where('recipient_id', $recipientId)
                    ->orWhere(function($q3) use ($userId, $recipientId) {
                        $q3->where('sender_id', $recipientId)->where('recipient_id', $userId);
                    });
            });
        }
        if ($q) {
            $query->where('body', 'like', "%$q%")
                  ->orWhere('id', $q);
        }
        $messages = $query->orderBy('created_at', 'desc')->limit(30)->get();
        return response()->json($messages);
    }
    // Pin a message
    public function pin(Request $request, $messageId)
    {
        $message = Message::with(['user', 'replyToMessage.user'])->findOrFail($messageId);
        
        if ($message->team_id) {
            // Team chat - update pinned_message_id on team
            $team = Team::findOrFail($message->team_id);
            $team->pinned_message_id = $messageId;
            $team->pinned_attachment_id = null;
            $team->save();
            
            broadcast(new \App\Events\Chat\MessagePinned($message, 'team', $message->team_id))->toOthers();
        } else {
            // DM - use dm_pinned_messages table
            $userId = auth()->user()->id;
            $ids = [$userId, $message->recipient_id == $userId ? $message->sender_id : $message->recipient_id];
            sort($ids);
            
            DmPinnedMessage::updateOrCreate(
                ['user_id_1' => $ids[0], 'user_id_2' => $ids[1]],
                ['pinned_message_id' => $messageId, 'pinned_attachment_id' => null]
            );
            
            broadcast(new \App\Events\Chat\MessagePinned($message, 'dm', implode('.', $ids)))->toOthers();
        }
        
        return response()->json([
            'status' => 'pinned',
            'message' => $message
        ]);
    }

    // Unpin a message
    public function unpin(Request $request, $messageId)
    {
        $message = Message::findOrFail($messageId);
        
        if ($message->team_id) {
            // Team chat
            $team = Team::findOrFail($message->team_id);
            $team->pinned_message_id = null;
            $team->pinned_attachment_id = null;
            $team->save();
            
            broadcast(new \App\Events\Chat\MessageUnpinned($messageId, 'team', $message->team_id))->toOthers();
        } else {
            // DM
            $userId = auth()->user()->id;
            $ids = [$userId, $message->recipient_id == $userId ? $message->sender_id : $message->recipient_id];
            sort($ids);
            
            DmPinnedMessage::where('user_id_1', $ids[0])
                ->where('user_id_2', $ids[1])
                ->update(['pinned_message_id' => null, 'pinned_attachment_id' => null]);
            
            broadcast(new \App\Events\Chat\MessageUnpinned($messageId, 'dm', implode('.', $ids)))->toOthers();
        }
        
        return response()->json(['status' => 'unpinned']);
    }

    // Get pinned message for a team or direct chat
    public function getPinned(Request $request)
    {
        $teamId = $request->input('team_id');
        $recipientId = $request->input('recipient_id');
        
        $pinnedMessage = null;
        $pinnedAttachment = null;
        
        if ($teamId) {
            $team = Team::find($teamId);
            if ($team) {
                if ($team->pinned_message_id) {
                    $pinnedMessage = Message::with(['user', 'reactions.user', 'replyToMessage.user'])
                        ->find($team->pinned_message_id);
                }
                if ($team->pinned_attachment_id) {
                    $pinnedAttachment = MessageAttachment::with('message.user')
                        ->find($team->pinned_attachment_id);
                }
            }
        } elseif ($recipientId) {
            $userId = auth()->user()->id;
            $otherUserId = $recipientId;
            
            $dmPinned = DmPinnedMessage::where('user_id_1', min($userId, $otherUserId))
                ->where('user_id_2', max($userId, $otherUserId))
                ->first();
                
            if ($dmPinned) {
                if ($dmPinned->pinned_message_id) {
                    $pinnedMessage = Message::with(['user', 'reactions.user', 'replyToMessage.user'])
                        ->find($dmPinned->pinned_message_id);
                }
                if ($dmPinned->pinned_attachment_id) {
                    $pinnedAttachment = MessageAttachment::with('message.user')
                        ->find($dmPinned->pinned_attachment_id);
                }
            }
        }
        
        return response()->json([
            'message' => $pinnedMessage,
            'attachment' => $pinnedAttachment
        ]);
    }
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 50);
        $beforeId = $request->input('before_id'); // Load messages before this ID
        
        $query = Message::query();
        if ($request->has('team_id')) {
            $query->where('team_id', $request->input('team_id'));
        } elseif ($request->has('recipient_id')) {
            $query->where(function($q) use ($request) {
                $q->where('sender_id', auth()->user()->id)
                  ->where('recipient_id', $request->input('recipient_id'));
            })->orWhere(function($q) use ($request) {
                $q->where('sender_id', $request->input('recipient_id'))
                  ->where('recipient_id', auth()->user()->id);
            });
        }
        
        // If before_id is provided, load messages before that ID
        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }
        
        // Clone query to check for more messages
        $checkQuery = clone $query;
        
        $messages = $query->with(['attachments.reactions.user', 'reads.user', 'reactions.user', 'user', 'replyToMessage.user'])
            ->orderBy('sent_at', 'desc')
            ->limit($perPage)
            ->get()
            ->reverse()
            ->values();
        
        // Check if there are more messages beyond what we just fetched
        $hasMore = false;
        if ($messages->count() > 0) {
            $oldestFetchedId = $messages->first()->id;
            $hasMore = $checkQuery->where('id', '<', $oldestFetchedId)->exists();
        }
        
        return response()->json([
            'messages' => $messages,
            'has_more' => $hasMore,
            'per_page' => $perPage
        ]);
    }

    public function store(Request $request)
    {
        \Log::info('MessageController store called', [
            'has_files' => $request->hasFile('attachments'),
            'files_count' => $request->hasFile('attachments') ? count($request->file('attachments')) : 0,
            'all_input' => $request->except(['attachments']),
        ]);
        
        $validationRules = [
            'team_id' => 'nullable|integer',
            'recipient_id' => 'nullable|integer',
            'mentions' => 'nullable|array',
            'reply_to_message_id' => 'nullable|integer|exists:pulse.messages,id',
            'attachments.*' => 'nullable|file|max:512000', // Max 500MB per file
        ];

        // Support both body and message fields
        if ($request->has('body')) {
            $validationRules['body'] = 'nullable|string';
        } else {
            $validationRules['message'] = 'nullable|string';
        }

        // Make type optional with default value
        $validationRules['type'] = 'sometimes|string';

        try {
            $data = $request->validate($validationRules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed', ['errors' => $e->errors()]);
            throw $e;
        }
        
        \Log::info('Validation passed', ['data_keys' => array_keys($data)]);
        
        // Handle file uploads if present
        $uploadedAttachments = [];
        if ($request->hasFile('attachments')) {
            \Log::info('Processing file uploads', ['count' => count($request->file('attachments'))]);
            foreach ($request->file('attachments') as $file) {
                // Store the file
                $path = $file->store('chat/attachments', 'public');
                
                // Create thumbnail for images
                $thumbnailPath = null;
                $isImage = str_starts_with($file->getMimeType(), 'image/');
                
                if ($isImage) {
                    // You can add thumbnail generation logic here if needed
                    $thumbnailPath = $path; // For now, use the same path
                }
                
                $uploadedAttachments[] = [
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $this->determineFileType($file->getMimeType()),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'storage_path' => $path,
                    'thumbnail_path' => $thumbnailPath,
                    'is_image' => $isImage,
                    'storage_driver' => 'public',
                ];
            }
        }
        
        // Determine message body from either 'body' or 'message' field
        $messageBody = $data['body'] ?? $data['message'] ?? null;
        
        $message = Message::create([
            'team_id' => $data['team_id'] ?? null,
            'sender_id' => auth()->user()->id,
            'recipient_id' => $data['recipient_id'] ?? null,
            'body' => $messageBody,
            'mentions' => isset($data['mentions']) && !empty($data['mentions']) ? json_encode($data['mentions']) : null,
            'type' => $data['type'] ?? 'message',
            'sent_at' => now(),
            'reply_to_message_id' => $data['reply_to_message_id'] ?? null,
        ]);
        
        // Attach uploaded attachments to the message
        if (!empty($uploadedAttachments)) {
            foreach ($uploadedAttachments as $attachmentData) {
                \App\Models\Chat\MessageAttachment::create([
                    'message_id' => $message->id,
                    'file_name' => $attachmentData['file_name'],
                    'file_type' => $attachmentData['file_type'],
                    'file_size' => $attachmentData['file_size'],
                    'mime_type' => $attachmentData['mime_type'],
                    'storage_path' => $attachmentData['storage_path'],
                    'thumbnail_path' => $attachmentData['thumbnail_path'] ?? null,
                    'is_image' => $attachmentData['is_image'] ?? false,
                    'storage_driver' => $attachmentData['storage_driver'],
                ]);
            }
        }
        
        try {
            $ids = [$message->sender_id, $message->recipient_id];
            sort($ids);
            \Log::info('Broadcasting message', [
                'message_id' => $message->id,
                'team_id' => $message->team_id,
                'sender_id' => $message->sender_id,
                'recipient_id' => $message->recipient_id,
                'channel' => $message->team_id 
                    ? 'chat.team.' . $message->team_id 
                    : 'chat.dm.' . implode('.', $ids),
            ]);
            broadcast(new MessageSent($message))->toOthers();
            // Notify mentioned users (if any)
            if (isset($data['mentions']) && is_array($data['mentions'])) {
                foreach ($data['mentions'] as $mentionId) {
                    if ($mentionId != auth()->user()->id) {
                        broadcast(new \App\Events\Chat\ChatNotification($mentionId, $message, 'mention'))->toOthers();
                    }
                }
            }
            // Notify DM recipient
            if (!empty($data['recipient_id']) && $data['recipient_id'] != auth()->user()->id) {
                broadcast(new \App\Events\Chat\ChatNotification($data['recipient_id'], $message, 'dm'))->toOthers();
            }
        } catch (\Exception $e) {
            // Log broadcast failure but don't stop message from being sent
            \Log::warning('Failed to broadcast message: ' . $e->getMessage());
        }
        return response()->json($message->load(['attachments.reactions.user', 'reads', 'reactions.user', 'user', 'replyToMessage.user']), 201);
    }
    // List direct message contacts for the current user
    public function contacts(Request $request)
    {
        $userId = auth()->user()->id;
        $contacts = User::whereIn('id', function($query) use ($userId) {
            $query->selectRaw('distinct if(sender_id = ?, recipient_id, sender_id)', [$userId])
                ->from('messages')
                ->where(function($q) use ($userId) {
                    $q->where('sender_id', $userId)->orWhere('recipient_id', $userId);
                })
                ->whereNotNull('recipient_id');
        })->with('employee:user_id,profile_photo')->get();
        
        \Log::debug('Fetched contacts for user', ['contacts_count' => $contacts->toArray()]);

        return response()->json($contacts);
    }
    
    // Check if a conversation exists with a specific user
    public function checkConversation(Request $request)
    {
        $userId = auth()->user()->id;
        $recipientId = $request->input('user_id');
        
        if (!$recipientId) {
            return response()->json(['error' => 'Missing user_id parameter'], 400);
        }
        
        $exists = Message::where(function($query) use ($userId, $recipientId) {
                $query->where('sender_id', $userId)
                      ->where('recipient_id', $recipientId);
            })
            ->orWhere(function($query) use ($userId, $recipientId) {
                $query->where('sender_id', $recipientId)
                      ->where('recipient_id', $userId);
            })
            ->exists();
            
        return response()->json(['exists' => $exists]);
    }

    // Fire typing event for direct messages
    public function typing(Request $request, $recipientId)
    {
        $user = auth()->user();
        broadcast(new \App\Events\Chat\DirectTyping($user->id, $user->name, $recipientId))->toOthers();
        return response()->json(['status' => 'ok']);
    }
    // Add a reaction to a message
    public function addReaction(Request $request, $messageId)
    {
        $data = $request->validate([
            'emoji' => 'required|string|max:32',
            'name' => 'nullable|string|max:100',
        ]);
        $userId = auth()->user()->id;
        
        // Check if reaction already exists (use binary comparison for emoji)
        $existingReaction = MessageReaction::where('message_id', $messageId)
            ->where('user_id', $userId)
            ->whereRaw('BINARY emoji = ?', [$data['emoji']])
            ->first();
        
        if ($existingReaction) {
            // Remove reaction if it exists (toggle off)
            $existingReaction->delete();
            broadcast(new \App\Events\Chat\MessageReactionRemoved($messageId, $userId, $data['emoji']))->toOthers();
        } else {
            // Add new reaction
            $reaction = MessageReaction::create([
                'message_id' => $messageId,
                'user_id' => $userId,
                'emoji' => $data['emoji'],
                'name' => $data['name'] ?? null,
            ]);
            // Load user and message relationships for broadcasting
            $reaction->load(['user', 'message']);
            broadcast(new \App\Events\Chat\MessageReactionAdded($reaction))->toOthers();
        }
        
        // Return all reactions for this message with user data
        $reactions = MessageReaction::where('message_id', $messageId)
            ->with('user')
            ->get();
        
        return response()->json(['status' => 'ok', 'reactions' => $reactions]);
    }

    // Remove a reaction from a message
    public function removeReaction(Request $request, $messageId)
    {
        $data = $request->validate([
            'emoji' => 'required|string|max:32',
        ]);
        $userId = auth()->user()->id;
        $deleted = MessageReaction::where([
            'message_id' => $messageId,
            'user_id' => $userId,
            'emoji' => $data['emoji'],
        ])->delete();
        if ($deleted) {
            broadcast(new \App\Events\Chat\MessageReactionRemoved($messageId, $userId, $data['emoji']))->toOthers();
        }
        return response()->json(['status' => 'ok']);
    }

        // Update (edit) a message
    public function update(Request $request, $id)
    {
        $message = Message::findOrFail($id);
        if (auth()->user()->id !== $message->sender_id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        $data = $request->validate([
            'body' => 'required|string',
        ]);
        $message->body = $data['body'];
        $message->is_edited = true;
        $message->save();
        broadcast(new \App\Events\Chat\MessageSent($message))->toOthers();
        return response()->json($message->load(['attachments.reactions.user', 'reads', 'reactions.user', 'user']));
    }

    // Delete a message
    public function destroy(Request $request, $id)
    {
        $message = Message::findOrFail($id);
        if (auth()->user()->id !== $message->sender_id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        
        // Soft delete - set deleted_at timestamp
        $message->deleted_at = now();
        $message->save();
        
        // Unpin if this message or any of its attachments are pinned
        if ($message->team_id) {
            $team = Team::findOrFail($message->team_id);
            // Check if message is pinned OR any attachment is pinned
            if ($team->pinned_message_id == $id || $team->pinned_attachment_id) {
                // Check if the pinned attachment belongs to this message
                $attachmentBelongsToMessage = $team->pinned_attachment_id && 
                    MessageAttachment::where('id', $team->pinned_attachment_id)
                        ->where('message_id', $id)
                        ->exists();
                
                if ($team->pinned_message_id == $id || $attachmentBelongsToMessage) {
                    $wasPinnedMessage = $team->pinned_message_id == $id;
                    $wasPinnedAttachment = $attachmentBelongsToMessage;
                    $team->pinned_message_id = null;
                    $team->pinned_attachment_id = null;
                    $team->save();
                    
                    // Broadcast unpin events
                    if ($wasPinnedMessage) {
                        broadcast(new \App\Events\Chat\MessageUnpinned($id, 'team', $message->team_id))->toOthers();
                    }
                    if ($wasPinnedAttachment) {
                        broadcast(new \App\Events\Chat\AttachmentUnpinned($team->pinned_attachment_id, 'team', $message->team_id))->toOthers();
                    }
                }
            }
        } elseif ($message->recipient_id) {
            $userId = auth()->user()->id;
            $ids = [$userId, $message->recipient_id == $userId ? $message->sender_id : $message->recipient_id];
            sort($ids);
            
            $dmPinned = DmPinnedMessage::where('user_id_1', $ids[0])
                ->where('user_id_2', $ids[1])
                ->first();
                
            if ($dmPinned && ($dmPinned->pinned_message_id == $id || $dmPinned->pinned_attachment_id)) {
                // Check if the pinned attachment belongs to this message
                $attachmentBelongsToMessage = $dmPinned->pinned_attachment_id && 
                    MessageAttachment::where('id', $dmPinned->pinned_attachment_id)
                        ->where('message_id', $id)
                        ->exists();
                
                if ($dmPinned->pinned_message_id == $id || $attachmentBelongsToMessage) {
                    $wasPinnedMessage = $dmPinned->pinned_message_id == $id;
                    $wasPinnedAttachment = $attachmentBelongsToMessage;
                    $pinnedAttachmentId = $dmPinned->pinned_attachment_id;
                    $dmPinned->update(['pinned_message_id' => null, 'pinned_attachment_id' => null]);
                    
                    // Broadcast unpin events
                    if ($wasPinnedMessage) {
                        broadcast(new \App\Events\Chat\MessageUnpinned($id, 'dm', implode('.', $ids)))->toOthers();
                    }
                    if ($wasPinnedAttachment) {
                        broadcast(new \App\Events\Chat\AttachmentUnpinned($pinnedAttachmentId, 'dm', implode('.', $ids)))->toOthers();
                    }
                }
            }
        }
        
        // Determine chat type and ID for broadcasting
        if ($message->team_id) {
            broadcast(new \App\Events\Chat\MessageDeleted($id, 'team', $message->team_id));
        } else {
            $userId = auth()->user()->id;
            $ids = [$userId, $message->recipient_id == $userId ? $message->sender_id : $message->recipient_id];
            sort($ids);
            broadcast(new \App\Events\Chat\MessageDeleted($id, 'dm', implode('.', $ids)));
        }
        
        return response()->json(['status' => 'deleted']);
    }
    
    public function restore(Request $request, $id)
    {
        $message = Message::findOrFail($id);
        if (auth()->user()->id !== $message->sender_id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        
        // Restore - clear deleted_at timestamp
        $message->deleted_at = null;
        $message->save();
        
        // Also restore all attachments for this message
        MessageAttachment::where('message_id', $id)->update(['deleted_at' => null]);
        
        // Reload with relationships including attachments
        $message = Message::with(['user', 'reactions.user', 'replyToMessage.user', 'attachments'])->find($id);
        
        // Determine chat type and ID for broadcasting
        if ($message->team_id) {
            broadcast(new \App\Events\Chat\MessageRestored($message, 'team', $message->team_id));
        } else {
            $userId = auth()->user()->id;
            $ids = [$userId, $message->recipient_id == $userId ? $message->sender_id : $message->recipient_id];
            sort($ids);
            broadcast(new \App\Events\Chat\MessageRestored($message, 'dm', implode('.', $ids)));
        }
        
        return response()->json([
            'status' => 'restored',
            'message' => $message
        ]);
    }
    
    /**
     * Determine file type from MIME type
     */
    private function determineFileType($mimeType)
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif ($mimeType === 'application/pdf') {
            return 'pdf';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        }
        return 'file';
    }

    // Add a reaction to an attachment
    public function addAttachmentReaction(Request $request, $attachmentId)
    {
        $data = $request->validate([
            'emoji' => 'required|string|max:32',
            'name' => 'nullable|string|max:100',
        ]);
        $userId = auth()->user()->id;
        
        // Check if attachment exists
        $attachment = \App\Models\Chat\MessageAttachment::find($attachmentId);
        if (!$attachment) {
            return response()->json(['error' => 'Attachment not found'], 404);
        }
        
        // Check if reaction already exists (use binary comparison for emoji)
        $existingReaction = \App\Models\Chat\AttachmentReaction::where('attachment_id', $attachmentId)
            ->where('user_id', $userId)
            ->whereRaw('BINARY emoji = ?', [$data['emoji']])
            ->first();
        
        if ($existingReaction) {
            // Remove reaction if it exists (toggle off)
            $existingReaction->delete();
            broadcast(new \App\Events\Chat\AttachmentReactionRemoved($attachmentId, $userId, $data['emoji'], $attachment->message))->toOthers();
        } else {
            // Add new reaction
            $reaction = \App\Models\Chat\AttachmentReaction::create([
                'attachment_id' => $attachmentId,
                'user_id' => $userId,
                'emoji' => $data['emoji'],
                'name' => $data['name'] ?? null,
            ]);
            // Load user and attachment relationships for broadcasting
            $reaction->load(['user', 'attachment']);
            broadcast(new \App\Events\Chat\AttachmentReactionAdded($reaction))->toOthers();
        }
        
        // Return all reactions for this attachment with user data
        $reactions = \App\Models\Chat\AttachmentReaction::where('attachment_id', $attachmentId)
            ->with('user')
            ->get();
        
        return response()->json(['status' => 'ok', 'reactions' => $reactions]);
    }

    // Remove a reaction from an attachment
    public function removeAttachmentReaction(Request $request, $attachmentId)
    {
        $data = $request->validate([
            'emoji' => 'required|string|max:32',
        ]);
        $userId = auth()->user()->id;
        
        // Check if attachment exists
        $attachment = \App\Models\Chat\MessageAttachment::find($attachmentId);
        if (!$attachment) {
            return response()->json(['error' => 'Attachment not found'], 404);
        }
        
        
        $deleted = \App\Models\Chat\AttachmentReaction::where([
            'attachment_id' => $attachmentId,
            'user_id' => $userId,
            'emoji' => $data['emoji'],
        ])->delete();
        
        if ($deleted) {
            broadcast(new \App\Events\Chat\AttachmentReactionRemoved($attachmentId, $userId, $data['emoji'], $attachment->message))->toOthers();
        }
        
        return response()->json(['status' => 'ok']);
    }

    // Pin an attachment (which pins the entire message)
    public function pinAttachment(Request $request, $attachmentId)
    {
        $attachment = MessageAttachment::with('message')->findOrFail($attachmentId);
        $message = $attachment->message;
        
        // Authorization check - only allow in team/DM chats where user belongs
        if ($message->team_id) {
            $team = Team::findOrFail($message->team_id);
            // Check if user is team member
            if (!$team->members()->where('user_id', auth()->id())->exists()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            // Pin only this attachment
            $team->pinned_attachment_id = $attachmentId;
            $team->pinned_message_id = null;
            $team->save();
            
            broadcast(new \App\Events\Chat\AttachmentPinned($attachment, 'team', $message->team_id))->toOthers();
        } elseif ($message->recipient_id) {
            // DM chat - update or create DmPinnedMessage
            $userId = auth()->id();
            $otherUserId = $message->sender_id === $userId ? $message->recipient_id : $message->sender_id;
            
            // Pin only this attachment
            DmPinnedMessage::updateOrCreate(
                [
                    'user_id_1' => min($userId, $otherUserId),
                    'user_id_2' => max($userId, $otherUserId),
                ],
                ['pinned_attachment_id' => $attachmentId, 'pinned_message_id' => null]
            );
            
            broadcast(new \App\Events\Chat\AttachmentPinned($attachment, 'dm', implode('.', [$userId, $otherUserId])))->toOthers();
        }
        
        return response()->json(['message' => $message, 'attachment' => $attachment]);
    }

    // Unpin an attachment
    public function unpinAttachment(Request $request, $attachmentId)
    {
        $attachment = MessageAttachment::with('message')->findOrFail($attachmentId);
        $message = $attachment->message;
        
        if ($message->team_id) {
            $team = Team::findOrFail($message->team_id);
            if ($team->pinned_attachment_id == $attachmentId) {
                $team->pinned_attachment_id = null;
                $team->pinned_message_id = null;
                $team->save();
                
                broadcast(new \App\Events\Chat\AttachmentUnpinned($attachmentId, 'team', $message->team_id))->toOthers();
            }
        } elseif ($message->recipient_id) {
            $userId = auth()->id();
            $otherUserId = $message->sender_id === $userId ? $message->recipient_id : $message->sender_id;
            
            DmPinnedMessage::where([
                'user_id_1' => min($userId, $otherUserId),
                'user_id_2' => max($userId, $otherUserId),
            ])->update(['pinned_message_id' => null, 'pinned_attachment_id' => null]);
            
            broadcast(new \App\Events\Chat\AttachmentUnpinned($attachmentId, 'dm', implode('.', [$userId, $otherUserId])))->toOthers();
        }
        
        return response()->json(['status' => 'ok']);
    }

    // Delete an attachment
    public function deleteAttachment(Request $request, $attachmentId)
    {
        $attachment = MessageAttachment::with('message')->findOrFail($attachmentId);
        $message = $attachment->message;
        
        // Only allow sender to delete their attachment
        if ($message->sender_id !== auth()->id() && $message->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Soft delete the attachment
        $attachment->deleted_at = now();
        $attachment->save();
        
        // If this was pinned, unpin it (clear both message and attachment)
        if ($message->team_id) {
            $team = Team::findOrFail($message->team_id);
            if ($team->pinned_attachment_id == $attachmentId) {
                $team->pinned_message_id = null;
                $team->pinned_attachment_id = null;
                $team->save();
                broadcast(new \App\Events\Chat\AttachmentUnpinned($attachmentId, 'team', $message->team_id))->toOthers();
            }
            broadcast(new \App\Events\Chat\AttachmentDeleted($attachmentId, 'team', $message->team_id))->toOthers();
        } elseif ($message->recipient_id) {
            $userId = auth()->id();
            $otherUserId = $message->sender_id === $userId ? $message->recipient_id : $message->sender_id;
            $wasPinned = DmPinnedMessage::where([
                'user_id_1' => min($userId, $otherUserId),
                'user_id_2' => max($userId, $otherUserId),
                'pinned_attachment_id' => $attachmentId,
            ])->exists();
            
            if ($wasPinned) {
                DmPinnedMessage::where([
                    'user_id_1' => min($userId, $otherUserId),
                    'user_id_2' => max($userId, $otherUserId),
                ])->update(['pinned_message_id' => null, 'pinned_attachment_id' => null]);
                broadcast(new \App\Events\Chat\AttachmentUnpinned($attachmentId, 'dm', implode('.', [$userId, $otherUserId])))->toOthers();
            }
            broadcast(new \App\Events\Chat\AttachmentDeleted($attachmentId, 'dm', implode('.', [$userId, $otherUserId])))->toOthers();
        }
        
        return response()->json(['status' => 'ok']);
    }

    // Restore a deleted attachment
    public function restoreAttachment(Request $request, $attachmentId)
    {
        $attachment = MessageAttachment::with('message')->findOrFail($attachmentId);
        $message = $attachment->message;
        
        // Only allow sender to restore their attachment
        if ($message->sender_id !== auth()->id() && $message->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Restore the attachment
        $attachment->deleted_at = null;
        $attachment->save();
        
        // Broadcast attachment restored event
        if ($message->team_id) {
            broadcast(new \App\Events\Chat\AttachmentRestored($attachment, 'team', $message->team_id))->toOthers();
        } elseif ($message->recipient_id) {
            $userId = auth()->id();
            $otherUserId = $message->sender_id === $userId ? $message->recipient_id : $message->sender_id;
            broadcast(new \App\Events\Chat\AttachmentRestored($attachment, 'dm', implode('.', [$userId, $otherUserId])))->toOthers();
        }
        
        return response()->json(['status' => 'ok', 'attachment' => $attachment]);
    }
}


