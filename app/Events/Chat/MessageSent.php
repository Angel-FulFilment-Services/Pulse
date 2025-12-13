<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Chat\Message;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message->load(['attachments', 'reads', 'user', 'replyToMessage.user', 'replyToAttachment']);
    }

    public function broadcastOn()
    {
        if ($this->message->team_id) {
            return new PresenceChannel('chat.team.' . $this->message->team_id);
        } else {
            // Direct message: use same channel format as frontend
            $ids = [$this->message->sender_id, $this->message->recipient_id];
            sort($ids);
            return new PresenceChannel('chat.dm.' . implode('.', $ids));
        }
    }

    public function broadcastWith()
    {
        return [
            'message' => $this->message->toArray(),
        ];
    }

    public function broadcastAs()
    {
        return 'MessageSent';
    }
}
