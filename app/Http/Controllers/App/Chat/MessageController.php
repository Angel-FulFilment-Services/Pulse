<?php
namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\Message;
use App\Models\Chat\MessageReaction;
use App\Models\Chat\MessageAttachment;
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
        $message = Message::findOrFail($messageId);
        $message->is_pinned = true;
        $message->save();
        return response()->json(['status' => 'pinned']);
    }

    // Unpin a message
    public function unpin(Request $request, $messageId)
    {
        $message = Message::findOrFail($messageId);
        $message->is_pinned = false;
        $message->save();
        return response()->json(['status' => 'unpinned']);
    }

    // Get pinned messages for a team or direct chat
    public function pinned(Request $request)
    {
        $teamId = $request->input('team_id');
        $recipientId = $request->input('recipient_id');
        $query = Message::query()->where('is_pinned', true);
        if ($teamId) {
            $query->where('team_id', $teamId);
        } elseif ($recipientId) {
            $userId = auth()->user()->id;
            $query->where(function($q) use ($userId, $recipientId) {
                $q->where('sender_id', $userId)->where('recipient_id', $recipientId)
                  ->orWhere(function($q2) use ($userId, $recipientId) {
                      $q2->where('sender_id', $recipientId)->where('recipient_id', $userId);
                  });
            });
        }
        $messages = $query->orderBy('created_at', 'desc')->limit(20)->get();
        return response()->json($messages);
    }
    public function index(Request $request)
    {
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
        $messages = $query->with(['attachments', 'reads.user', 'reactions', 'user', 'replyToMessage.user'])->orderBy('sent_at', 'asc')->get();
        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $validationRules = [
            'team_id' => 'nullable|integer',
            'recipient_id' => 'nullable|integer',
            'mentions' => 'nullable|array',
            'reply_to_message_id' => 'nullable|integer|exists:pulse.messages,id',
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
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('chat_attachments', 'r2');
                MessageAttachment::create([
                    'message_id' => $message->id,
                    'file_path' => $path,
                    'file_type' => $file->getClientMimeType(),
                    'file_name' => $file->getClientOriginalName(),
                    'uploaded_by' => auth()->user()->id,
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
        return response()->json($message->load(['attachments', 'reads', 'reactions', 'user', 'replyToMessage.user']), 201);
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
        })->get();
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
        ]);
        $userId = auth()->user()->id;
        $reaction = MessageReaction::firstOrCreate([
            'message_id' => $messageId,
            'user_id' => $userId,
            'emoji' => $data['emoji'],
        ]);
        broadcast(new \App\Events\Chat\MessageReactionAdded($reaction))->toOthers();
        return response()->json(['status' => 'ok', 'reaction' => $reaction]);
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
        return response()->json($message->load(['attachments', 'reads', 'reactions', 'user']));
    }

    // Delete a message
    public function destroy(Request $request, $id)
    {
        $message = Message::findOrFail($id);
        if (auth()->user()->id !== $message->sender_id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        $message->delete();
        broadcast(new \App\Events\Chat\MessageDeleted($id))->toOthers();
        return response()->json(['status' => 'deleted']);
    }
}
