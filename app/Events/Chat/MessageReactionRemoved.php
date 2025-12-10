<?php
namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageReactionRemoved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $messageId;
    public $userId;
    public $emoji;

    public function __construct($messageId, $userId, $emoji)
    {
        $this->messageId = $messageId;
        $this->userId = $userId;
        $this->emoji = $emoji;
    }

    public function broadcastOn()
    {
        // You may want to fetch the message to determine the channel
        // For simplicity, broadcast to a generic channel (frontend should filter)
        return new PrivateChannel('message.' . $this->messageId);
    }

    public function broadcastWith()
    {
        return [
            'message_id' => $this->messageId,
            'user_id' => $this->userId,
            'emoji' => $this->emoji,
        ];
    }
}
