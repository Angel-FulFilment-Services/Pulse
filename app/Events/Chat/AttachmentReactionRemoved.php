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

class AttachmentReactionRemoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $attachmentId;
    public $userId;
    public $emoji;
    public $message;

    public function __construct($attachmentId, $userId, $emoji, $message)
    {
        $this->attachmentId = $attachmentId;
        $this->userId = $userId;
        $this->emoji = $emoji;
        $this->message = $message;
    }

    public function broadcastOn()
    {
        // Broadcast to the message's team or DM channel
        if ($this->message->team_id) {
            return new PresenceChannel('chat.team.' . $this->message->team_id);
        } elseif ($this->message->recipient_id) {
            $ids = [$this->message->sender_id, $this->message->recipient_id];
            sort($ids);
            return new PresenceChannel('chat.dm.' . implode('.', $ids));
        }
        return [];
    }

    public function broadcastWith()
    {
        return [
            'attachment_id' => $this->attachmentId,
            'user_id' => $this->userId,
            'emoji' => $this->emoji,
        ];
    }

    public function broadcastAs()
    {
        return 'AttachmentReactionRemoved';
    }
}
