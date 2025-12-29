<?php

namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\MessageRead;
use App\Events\Chat\MessageRead as MessageReadEvent;

class MessageReadController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'message_id' => 'required|integer',
        ]);
        
        // Check if message exists using the pulse connection
        $message = \App\Models\Chat\Message::find($data['message_id']);
        if (!$message) {
            return response()->json(['error' => 'Message not found'], 404);
        }
        
        $userId = $request->user()->id;
        
        // If this is a team message, check if user is actually a team member
        // Monitor users should not mark messages as read (they're just observing)
        if ($message->team_id) {
            $isMember = \DB::connection('pulse')->table('team_user')
                ->where('team_id', $message->team_id)
                ->where('user_id', $userId)
                ->whereNull('left_at')
                ->exists();
            
            if (!$isMember) {
                // User is monitoring, not actually in the team - don't mark as read
                return response()->json(['status' => 'monitoring']);
            }
        }
        
        $read = MessageRead::firstOrCreate([
            'message_id' => $data['message_id'],
            'user_id' => $userId,
        ], [
            'read_at' => now(),
        ]);
        
        // Load the message and user relationships before broadcasting
        $read->load(['message', 'user']);
        
        broadcast(new MessageReadEvent($read))->toOthers();
        return response()->json($read);
    }

    public function storeBatch(Request $request)
    {
        $data = $request->validate([
            'message_ids' => 'required|array',
            'message_ids.*' => 'integer',
        ]);
        
        $userId = $request->user()->id;
        $reads = [];
        
        // Process in reverse order (latest to oldest) so the "seen" marker doesn't jump around
        foreach (array_reverse($data['message_ids']) as $messageId) {
            // Check if message exists
            $message = \App\Models\Chat\Message::find($messageId);
            if (!$message) {
                continue; // Skip invalid messages
            }
            
            // If this is a team message, check if user is actually a team member
            // Monitor users should not mark messages as read (they're just observing)
            if ($message->team_id) {
                $isMember = \DB::connection('pulse')->table('team_user')
                    ->where('team_id', $message->team_id)
                    ->where('user_id', $userId)
                    ->whereNull('left_at')
                    ->exists();
                
                if (!$isMember) {
                    continue; // Skip - user is monitoring, not actually in the team
                }
            }
            
            $read = MessageRead::firstOrCreate([
                'message_id' => $messageId,
                'user_id' => $userId,
            ], [
                'read_at' => now(),
            ]);
            
            // Load the message and user relationships
            $read->load(['message', 'user']);
            
            $reads[] = $read;
        }
        
        // Broadcast all reads at once
        if (!empty($reads)) {
            broadcast(new MessageReadEvent($reads))->toOthers();
        }
        
        return response()->json(['reads' => $reads]);
    }
}
