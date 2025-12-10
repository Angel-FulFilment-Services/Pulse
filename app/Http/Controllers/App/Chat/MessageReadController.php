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
}
