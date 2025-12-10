<?php
namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $messageId;

    public function __construct($messageId)
    {
        $this->messageId = $messageId;
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
        ];
    }
}
