<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRestored implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $chatType;
    public $chatId;

    /**
     * Create a new event instance.
     */
    public function __construct($message, $chatType, $chatId)
    {
        $this->message = $message;
        $this->chatType = $chatType;
        $this->chatId = $chatId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if ($this->chatType === 'team') {
            return [new PresenceChannel('chat.team.' . $this->chatId)];
        } else {
            return [new PresenceChannel('chat.dm.' . $this->chatId)];
        }
    }
    
    public function broadcastAs()
    {
        return 'MessageRestored';
    }
    
    public function broadcastWith()
    {
        return [
            'message' => $this->message,
        ];
    }
}
