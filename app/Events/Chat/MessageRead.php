<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Chat\MessageRead as MessageReadModel;

class MessageRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $messageRead;

    public function __construct(MessageReadModel $messageRead)
    {
        $this->messageRead = $messageRead;
    }

    public function broadcastOn()
    {
        // Notify the sender and the reader
        return [
            new PrivateChannel('chat.user.' . $this->messageRead->user_id),
            new PrivateChannel('chat.user.' . $this->messageRead->message->sender_id),
        ];
    }

    public function broadcastWith()
    {
        return [
            'message_read' => $this->messageRead->toArray(),
        ];
    }

    public function broadcastAs()
    {
        return 'MessageRead';
    }
}
