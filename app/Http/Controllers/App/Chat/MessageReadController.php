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
        
        $read = MessageRead::firstOrCreate([
            'message_id' => $data['message_id'],
            'user_id' => $request->user()->id,
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
        
        $reads = [];
        
        // Process in reverse order (latest to oldest) so the "seen" marker doesn't jump around
        foreach (array_reverse($data['message_ids']) as $messageId) {
            // Check if message exists
            $message = \App\Models\Chat\Message::find($messageId);
            if (!$message) {
                continue; // Skip invalid messages
            }
            
            $read = MessageRead::firstOrCreate([
                'message_id' => $messageId,
                'user_id' => $request->user()->id,
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
