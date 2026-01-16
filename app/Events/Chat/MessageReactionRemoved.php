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

class MessageReactionRemoved implements ShouldBroadcastNow
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
        // Broadcast to the message's team or DM channel
        $message = Message::find($this->messageId);
        if (!$message) {
            return [];
        }
        
        if ($message->team_id) {
            return new PresenceChannel('chat.team.' . $message->team_id);
        } elseif ($message->recipient_id) {
            $ids = [$message->sender_id, $message->recipient_id];
            sort($ids);
            return new PresenceChannel('chat.dm.' . implode('.', $ids));
        }
        return [];
    }

    public function broadcastWith()
    {
        return [
            'message_id' => $this->messageId,
            'user_id' => $this->userId,
            'emoji' => $this->emoji,
        ];
    }

    public function broadcastAs()
    {
        return 'MessageReactionRemoved';
    }
}
