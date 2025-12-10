<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\MessageRead;
use App\Events\Chat\MessageRead as MessageReadEvent;

class MessageReadController extends Controller
{
    // Mark a message as read
    public function store(Request $request)
    {
        $data = $request->validate([
            'message_id' => 'required|integer|exists:messages,id',
        ]);
        $read = MessageRead::firstOrCreate([
            'message_id' => $data['message_id'],
            'user_id' => $request->user()->id,
        ], [
            'read_at' => now(),
        ]);
        broadcast(new MessageReadEvent($read))->toOthers();
        return response()->json($read);
    }
}
