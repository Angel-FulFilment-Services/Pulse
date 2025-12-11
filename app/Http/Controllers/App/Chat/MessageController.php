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
            $team->save();
            
            broadcast(new \App\Events\Chat\MessagePinned($message, 'team', $message->team_id))->toOthers();
        } else {
            // DM - use dm_pinned_messages table
            $userId = auth()->user()->id;
            $ids = [$userId, $message->recipient_id == $userId ? $message->sender_id : $message->recipient_id];
            sort($ids);
            
            DmPinnedMessage::updateOrCreate(
                ['user_id_1' => $ids[0], 'user_id_2' => $ids[1]],
                ['pinned_message_id' => $messageId]
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
            $team->save();
            
            broadcast(new \App\Events\Chat\MessageUnpinned($messageId, 'team', $message->team_id))->toOthers();
        } else {
            // DM
            $userId = auth()->user()->id;
            $ids = [$userId, $message->recipient_id == $userId ? $message->sender_id : $message->recipient_id];
            sort($ids);
            
            DmPinnedMessage::where('user_id_1', $ids[0])
                ->where('user_id_2', $ids[1])
                ->update(['pinned_message_id' => null]);
            
            broadcast(new \App\Events\Chat\MessageUnpinned($messageId, 'dm', implode('.', $ids)))->toOthers();
        }
        
        return response()->json(['status' => 'unpinned']);
    }

    // Get pinned message for a team or direct chat
    public function getPinned(Request $request)
    {
        $teamId = $request->input('team_id');
        $recipientId = $request->input('recipient_id');
        
        if ($teamId) {
            $team = Team::find($teamId);
            if ($team && $team->pinned_message_id) {
                $message = Message::with(['user', 'reactions.user', 'replyToMessage.user'])
                    ->find($team->pinned_message_id);
                return response()->json($message);
            }
        } elseif ($recipientId) {
            $userId = auth()->user()->id;
            $ids = [$userId, $recipientId];
            sort($ids);
            
            $dmPinned = DmPinnedMessage::where('user_id_1', $ids[0])
                ->where('user_id_2', $ids[1])
                ->first();
                
            if ($dmPinned && $dmPinned->pinned_message_id) {
                $message = Message::with(['user', 'reactions.user', 'replyToMessage.user'])
                    ->find($dmPinned->pinned_message_id);
                return response()->json($message);
            }
        }
        
        return response()->json(null);
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
        
        $messages = $query->with(['attachments', 'reads.user', 'reactions.user', 'user', 'replyToMessage.user'])
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
        $validationRules = [
            'team_id' => 'nullable|integer',
            'recipient_id' => 'nullable|integer',
            'mentions' => 'nullable|array',
            'reply_to_message_id' => 'nullable|integer|exists:pulse.messages,id',
            'attachments' => 'nullable|array', // Uploaded attachment metadata
        ];

        // Support both body and message fields
        if ($request->has('body')) {
            $validationRules['body'] = 'nullable|string';
        } else {
            $validationRules['message'] = 'nullable|string';
        }

        // Make type optional with default value
        $validationRules['type'] = 'sometimes|string';

        $data = $request->validate($validationRules);
        
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
        if (isset($data['attachments']) && is_array($data['attachments'])) {
            foreach ($data['attachments'] as $attachmentData) {
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
        return response()->json($message->load(['attachments', 'reads', 'reactions.user', 'user', 'replyToMessage.user']), 201);
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
        return response()->json($message->load(['attachments', 'reads', 'reactions.user', 'user']));
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
        
        // Reload with relationships
        $message = Message::with(['user', 'reactions.user', 'replyToMessage.user'])->find($id);
        
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
}
