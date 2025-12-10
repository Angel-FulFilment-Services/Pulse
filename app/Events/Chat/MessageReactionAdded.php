<?php
namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Chat\MessageReaction;

class MessageReactionAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reaction;

    public function __construct(MessageReaction $reaction)
    {
        $this->reaction = $reaction;
    }

    public function broadcastOn()
    {
        // Broadcast to the message's team or DM channel
        $message = $this->reaction->message;
        if ($message->team_id) {
            return new PrivateChannel('team.' . $message->team_id);
        } elseif ($message->recipient_id) {
            $ids = [$message->sender_id, $message->recipient_id];
            sort($ids);
            return new PrivateChannel('dm.' . implode('.', $ids));
        }
        return [];
    }

    public function broadcastWith()
    {
        return [
            'reaction' => $this->reaction->toArray(),
        ];
    }
}
