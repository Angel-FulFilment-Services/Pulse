<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Chat\Message;

class MessagePinned implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $chatType;
    public $chatId;

    public function __construct(Message $message, $chatType, $chatId)
    {
        $this->message = $message;
        $this->chatType = $chatType;
        $this->chatId = $chatId;
    }

    public function broadcastOn()
    {
        if ($this->chatType === 'team') {
            return new PresenceChannel('chat.team.' . $this->chatId);
        } else {
            return new PresenceChannel('chat.dm.' . $this->chatId);
        }
    }

    public function broadcastWith()
    {
        return [
            'message' => $this->message,
        ];
    }

    public function broadcastAs()
    {
        return 'MessagePinned';
    }
}
