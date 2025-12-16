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
use App\Models\Chat\AttachmentReaction;

class AttachmentReactionAdded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reaction;

    public function __construct(AttachmentReaction $reaction)
    {
        $this->reaction = $reaction;
    }

    public function broadcastOn()
    {
        // Broadcast to the attachment's message's team or DM channel
        $attachment = $this->reaction->attachment;
        $message = $attachment->message;
        
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
            'reaction' => [
                'id' => $this->reaction->id,
                'attachment_id' => $this->reaction->attachment_id,
                'user_id' => $this->reaction->user_id,
                'emoji' => $this->reaction->emoji,
                'name' => $this->reaction->name,
                'created_at' => $this->reaction->created_at,
                'updated_at' => $this->reaction->updated_at,
                'user' => $this->reaction->user ? [
                    'id' => $this->reaction->user->id,
                    'name' => $this->reaction->user->name,
                    'email' => $this->reaction->user->email,
                ] : null,
            ]
        ];
    }

    public function broadcastAs()
    {
        return 'AttachmentReactionAdded';
    }
}
