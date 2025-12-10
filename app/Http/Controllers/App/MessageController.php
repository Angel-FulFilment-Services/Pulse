<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\Message;
use App\Models\Chat\MessageAttachment;

class MessageController extends Controller
{
    // List messages for a team or direct chat
    public function index(Request $request)
    {
        $query = Message::query();
        if ($request->has('team_id')) {
            $query->where('team_id', $request->input('team_id'));
        } elseif ($request->has('recipient_id')) {
            $query->where(function($q) use ($request) {
                $q->where('sender_id', $request->user()->id)
                  ->where('recipient_id', $request->input('recipient_id'));
            })->orWhere(function($q) use ($request) {
                $q->where('sender_id', $request->input('recipient_id'))
                  ->where('recipient_id', $request->user()->id);
            });
        }
        $messages = $query->with(['attachments', 'reads'])->orderBy('sent_at', 'asc')->get();
        return response()->json($messages);
    }

    // Send a message
    public function store(Request $request)
    {
        $data = $request->validate([
            'team_id' => 'nullable|integer|exists:teams,id',
            'recipient_id' => 'nullable|integer|exists:users,id',
            'body' => 'nullable|string',
            'mentions' => 'nullable|array',
            'type' => 'required|string',
        ]);
        $message = Message::create([
            'team_id' => $data['team_id'] ?? null,
            'sender_id' => $request->user()->id,
            'recipient_id' => $data['recipient_id'] ?? null,
            'body' => $data['body'] ?? null,
            'mentions' => $data['mentions'] ? json_encode($data['mentions']) : null,
            'type' => $data['type'],
            'sent_at' => now(),
        ]);
        // Handle attachments (if any)
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('chat_attachments', 'r2');
                MessageAttachment::create([
                    'message_id' => $message->id,
                    'file_path' => $path,
                    'file_type' => $file->getClientMimeType(),
                    'file_name' => $file->getClientOriginalName(),
                    'uploaded_by' => $request->user()->id,
                ]);
            }
        }
        // Broadcast message event
        broadcast(new MessageSent($message))->toOthers();
        return response()->json($message->load(['attachments', 'reads']), 201);
    }
}
