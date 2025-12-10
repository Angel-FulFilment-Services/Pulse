<?php
namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\ChatUserPreference;
use App\Models\Chat\Message;

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

    // Toggle mark as unread/read for the latest message
    public function toggleMarkUnread(Request $request)
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
            
            // Check if the message is already read by this user
            $messageRead = \DB::connection('pulse')
                ->table('message_reads')
                ->where('message_id', $latestMessage->id)
                ->where('user_id', $userId)
                ->first();
            
            if ($messageRead) {
                // Message is read, mark as unread by removing the read record
                \DB::connection('pulse')
                    ->table('message_reads')
                    ->where('message_id', $latestMessage->id)
                    ->where('user_id', $userId)
                    ->delete();
                    
                return response()->json(['status' => 'marked_unread']);
            } else {
                // Message is unread, mark as read by adding a read record
                \DB::connection('pulse')
                    ->table('message_reads')
                    ->insert([
                        'message_id' => $latestMessage->id,
                        'user_id' => $userId,
                        'read_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                return response()->json(['status' => 'marked_read']);
            }
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to toggle message read status: ' . $e->getMessage()], 500);
        }
    }

    // Hide chat
    public function hideChat(Request $request)
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

    // Mute/unmute chat
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

    // Remove chat history
    public function removeChatHistory(Request $request)
    {
        $data = $request->validate([
            'chat_id' => 'required|integer',
            'chat_type' => 'required|in:team,user'
        ]);

        $userId = auth()->user()->id;
        
        try {
            if ($data['chat_type'] === 'team') {
                // For team chats, delete all messages from this user in this team
                Message::where('team_id', $data['chat_id'])
                    ->where('sender_id', $userId)
                    ->delete();
            } else {
                // For direct messages, delete all messages between these two users
                Message::where(function($query) use ($userId, $data) {
                    $query->where('sender_id', $userId)
                          ->where('recipient_id', $data['chat_id']);
                })->orWhere(function($query) use ($userId, $data) {
                    $query->where('sender_id', $data['chat_id'])
                          ->where('recipient_id', $userId);
                })->where('team_id', null) // Ensure it's a direct message
                ->delete();
            }

            return response()->json(['status' => 'history_removed']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to remove chat history'], 500);
        }
    }
}
