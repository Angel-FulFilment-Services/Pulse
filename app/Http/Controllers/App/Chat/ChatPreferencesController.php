<?php
namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\ChatUserPreference;
use App\Models\Chat\Message;
use App\Models\Chat\MessageRead;
use App\Events\Chat\MessageRead as MessageReadEvent;
use App\Events\Chat\MessageUnread as MessageUnreadEvent;
use Carbon\Carbon;

class ChatPreferencesController extends Controller
{
    public function get(Request $request)
    {
        $prefs = $request->user()->chat_preferences ?? [
            'notifications' => true,
            'sound' => true,
        ];
        return response()->json($prefs);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'notifications' => 'boolean',
            'sound' => 'boolean',
        ]);
        $user = $request->user();
        $prefs = $user->chat_preferences ?? [];
        $prefs = array_merge($prefs, $data);
        $user->chat_preferences = $prefs;
        $user->save();
        return response()->json($prefs);
    }

    // Get all chat preferences for the current user
    public function getChatPreferences(Request $request)
    {
        $userId = auth()->user()->id;
        $preferences = ChatUserPreference::where('user_id', $userId)->get();
        
        return response()->json($preferences);
    }

    /**
     * Mark as unread - deletes read receipts for the last message and any messages read within 1 minute before it
     */
    public function markUnread(Request $request)
    {
        $data = $request->validate([
            'chat_id' => 'required|integer',
            'chat_type' => 'required|in:team,user'
        ]);

        $userId = auth()->user()->id;
        
        try {
            // Find the latest message in this chat
            $latestMessage = null;
            
            if ($data['chat_type'] === 'team') {
                $latestMessage = Message::where('team_id', $data['chat_id'])
                    ->orderBy('created_at', 'desc')
                    ->first();
            } else {
                // For direct messages
                $latestMessage = Message::where(function($query) use ($userId, $data) {
                    $query->where('sender_id', $userId)
                          ->where('recipient_id', $data['chat_id']);
                })->orWhere(function($query) use ($userId, $data) {
                    $query->where('sender_id', $data['chat_id'])
                          ->where('recipient_id', $userId);
                })->where('team_id', null)
                ->orderBy('created_at', 'desc')
                ->first();
            }
            
            if (!$latestMessage) {
                return response()->json(['error' => 'No messages found in this chat'], 404);
            }
            
            // Get the read record for the latest message
            $latestReadRecord = \DB::connection('pulse')
                ->table('message_reads')
                ->where('message_id', $latestMessage->id)
                ->where('user_id', $userId)
                ->first();
            
            if ($latestReadRecord) {
                // Delete this read record and any read records from 5 minutes before it
                $cutoffTime = Carbon::parse($latestReadRecord->read_at)->subMinutes(5);
                
                // Get all message IDs in this chat
                $messageIds = [];
                if ($data['chat_type'] === 'team') {
                    $messageIds = Message::where('team_id', $data['chat_id'])
                        ->pluck('id')
                        ->toArray();
                } else {
                    $messageIds = Message::where(function($query) use ($userId, $data) {
                        $query->where('sender_id', $userId)
                              ->where('recipient_id', $data['chat_id']);
                    })->orWhere(function($query) use ($userId, $data) {
                        $query->where('sender_id', $data['chat_id'])
                              ->where('recipient_id', $userId);
                    })->where('team_id', null)
                    ->pluck('id')
                    ->toArray();
                }
                
                // Delete read records for these messages that were read after the cutoff time
                $deletedMessageIds = \DB::connection('pulse')
                    ->table('message_reads')
                    ->where('user_id', $userId)
                    ->whereIn('message_id', $messageIds)
                    ->where('read_at', '>=', $cutoffTime)
                    ->pluck('message_id')
                    ->toArray();
                
                \DB::connection('pulse')
                    ->table('message_reads')
                    ->where('user_id', $userId)
                    ->whereIn('message_id', $messageIds)
                    ->where('read_at', '>=', $cutoffTime)
                    ->delete();
                
                // Broadcast unread event if messages were unmarked
                if (!empty($deletedMessageIds)) {
                    $unreadCount = count($deletedMessageIds);
                    
                    broadcast(new MessageUnreadEvent(
                        $deletedMessageIds,
                        $userId,
                        $data['chat_id'],
                        $data['chat_type']
                    ))->toOthers();
                    
                    return response()->json([
                        'status' => 'marked_unread',
                        'unread_count' => $unreadCount
                    ]);
                }
            }
            
            return response()->json(['status' => 'already_unread', 'unread_count' => 0]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to mark as unread: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Hide chat - sets is_hidden flag, unhides when searching or composing new message
     */
    public function hide(Request $request)
    {
        $data = $request->validate([
            'chat_id' => 'required|integer',
            'chat_type' => 'required|in:team,user'
        ]);

        $userId = auth()->user()->id;
        
        $preference = ChatUserPreference::updateOrCreate(
            [
                'user_id' => $userId,
                'chat_id' => $data['chat_id'],
                'chat_type' => $data['chat_type']
            ],
            [
                'is_hidden' => true
            ]
        );

        return response()->json(['status' => 'hidden', 'preference' => $preference]);
    }

    /**
     * Toggle mute - sets is_muted flag for notification preferences
     */
    public function toggleMute(Request $request)
    {
        $data = $request->validate([
            'chat_id' => 'required|integer',
            'chat_type' => 'required|in:team,user'
        ]);

        $userId = auth()->user()->id;
        
        $preference = ChatUserPreference::where([
            'user_id' => $userId,
            'chat_id' => $data['chat_id'],
            'chat_type' => $data['chat_type']
        ])->first();

        $isMuted = $preference ? !$preference->is_muted : true;
        
        $preference = ChatUserPreference::updateOrCreate(
            [
                'user_id' => $userId,
                'chat_id' => $data['chat_id'],
                'chat_type' => $data['chat_type']
            ],
            [
                'is_muted' => $isMuted
            ]
        );

        return response()->json([
            'status' => $isMuted ? 'muted' : 'unmuted', 
            'preference' => $preference
        ]);
    }

    /**
     * Remove chat history - stores datetime cutoff, messages before this won't display
     */
    public function removeHistory(Request $request)
    {
        $data = $request->validate([
            'chat_id' => 'required|integer',
            'chat_type' => 'required|in:team,user'
        ]);

        $userId = auth()->user()->id;
        
        // Store the current datetime as the cutoff point
        $preference = ChatUserPreference::updateOrCreate(
            [
                'user_id' => $userId,
                'chat_id' => $data['chat_id'],
                'chat_type' => $data['chat_type']
            ],
            [
                'history_removed_at' => now()
            ]
        );

        return response()->json([
            'status' => 'history_removed',
            'preference' => $preference
        ]);
    }

    /**
     * Mark as read - marks all messages in chat as read
     */
    public function markRead(Request $request)
    {
        $data = $request->validate([
            'chat_id' => 'required|integer',
            'chat_type' => 'required|in:team,user'
        ]);

        $userId = auth()->user()->id;
        
        try {
            // Get all message IDs in this chat
            $messageIds = [];
            if ($data['chat_type'] === 'team') {
                $messageIds = Message::where('team_id', $data['chat_id'])
                    ->pluck('id')
                    ->toArray();
            } else {
                $messageIds = Message::where(function($query) use ($userId, $data) {
                    $query->where('sender_id', $userId)
                          ->where('recipient_id', $data['chat_id']);
                })->orWhere(function($query) use ($userId, $data) {
                    $query->where('sender_id', $data['chat_id'])
                          ->where('recipient_id', $userId);
                })->where('team_id', null)
                ->pluck('id')
                ->toArray();
            }
            
            if (empty($messageIds)) {
                return response()->json(['status' => 'no_messages']);
            }
            
            // Get already read message IDs
            $alreadyRead = \DB::connection('pulse')
                ->table('message_reads')
                ->where('user_id', $userId)
                ->whereIn('message_id', $messageIds)
                ->pluck('message_id')
                ->toArray();
            
            // Find unread message IDs
            $unreadMessageIds = array_diff($messageIds, $alreadyRead);
            
            // Insert read records for unread messages and broadcast events
            if (!empty($unreadMessageIds)) {
                $reads = [];
                foreach ($unreadMessageIds as $messageId) {
                    // Create the read record
                    $read = MessageRead::firstOrCreate([
                        'message_id' => $messageId,
                        'user_id' => $userId,
                    ], [
                        'read_at' => now(),
                    ]);
                    
                    // Load relationships for broadcasting
                    $read->load(['message', 'user']);
                    $reads[] = $read;
                }
                
                // Broadcast all read events
                if (!empty($reads)) {
                    broadcast(new MessageReadEvent($reads))->toOthers();
                }
            }
            
            return response()->json(['status' => 'marked_read', 'count' => count($unreadMessageIds)]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to mark as read: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Unhide chat - removes is_hidden flag, makes chat reappear in sidebar
     */
    public function unhide(Request $request)
    {
        $data = $request->validate([
            'chat_id' => 'required|integer',
            'chat_type' => 'required|in:team,user'
        ]);

        $userId = auth()->user()->id;
        
        $preference = ChatUserPreference::updateOrCreate(
            [
                'user_id' => $userId,
                'chat_id' => $data['chat_id'],
                'chat_type' => $data['chat_type']
            ],
            [
                'is_hidden' => false
            ]
        );

        return response()->json(['status' => 'unhidden', 'preference' => $preference]);
    }

    /**
     * Mute chat - sets is_muted to true
     */
    public function mute(Request $request)
    {
        $data = $request->validate([
            'chat_id' => 'required|integer',
            'chat_type' => 'required|in:team,user'
        ]);

        $userId = auth()->user()->id;
        
        $preference = ChatUserPreference::updateOrCreate(
            [
                'user_id' => $userId,
                'chat_id' => $data['chat_id'],
                'chat_type' => $data['chat_type']
            ],
            [
                'is_muted' => true
            ]
        );

        return response()->json(['status' => 'muted', 'preference' => $preference]);
    }

    /**
     * Unmute chat - sets is_muted to false
     */
    public function unmute(Request $request)
    {
        $data = $request->validate([
            'chat_id' => 'required|integer',
            'chat_type' => 'required|in:team,user'
        ]);

        $userId = auth()->user()->id;
        
        $preference = ChatUserPreference::updateOrCreate(
            [
                'user_id' => $userId,
                'chat_id' => $data['chat_id'],
                'chat_type' => $data['chat_type']
            ],
            [
                'is_muted' => false
            ]
        );

        return response()->json(['status' => 'unmuted', 'preference' => $preference]);
    }
}
