<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\SerializesModels;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels as QueueSerializesModels;

class DirectTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels, QueueSerializesModels;

    public $userId;
    public $userName;
    public $recipientId;

    public function __construct($userId, $userName, $recipientId)
    {
        $this->userId = $userId;
        $this->userName = $userName;
        $this->recipientId = $recipientId;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('chat.direct.' . $this->recipientId);
    }

    public function broadcastWith()
    {
        return [
            'user_id' => $this->userId,
            'user_name' => $this->userName,
            'recipient_id' => $this->recipientId,
        ];
    }

    public function broadcastAs()
    {
        return 'DirectTyping';
    }
}
