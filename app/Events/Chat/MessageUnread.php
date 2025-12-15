<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageUnread implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $messageIds;
    public $userId;
    public $chatId;
    public $chatType;
    public $otherUserId;

    /**
     * Create a new event instance.
     */
    public function __construct($messageIds, $userId, $chatId, $chatType)
    {
        $this->messageIds = is_array($messageIds) ? $messageIds : [$messageIds];
        $this->userId = $userId;
        $this->chatId = $chatId;
        $this->chatType = $chatType;
        // For DM, chatId is the other user's ID
        $this->otherUserId = $chatId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // For DM: broadcast to the other user's private channel so they receive it
        // regardless of which chat they have selected
        // For team: broadcast to all team members' channels (they need to refresh sidebar)
        if ($this->chatType === 'team') {
            // For team chats, broadcast to the team channel
            // All team members subscribed to this channel will receive it
            return [
                new PrivateChannel('chat.team.' . $this->chatId)
            ];
        } else {
            // For DM, broadcast to the other user's private channel
            // so they see the unread indicator update in their sidebar
            return [
                new PrivateChannel('chat.user.' . $this->otherUserId)
            ];
        }
    }

    public function broadcastWith()
    {
        return [
            'message_ids' => $this->messageIds,
            'user_id' => $this->userId,
            'chat_id' => $this->chatId,
            'chat_type' => $this->chatType,
        ];
    }

    public function broadcastAs()
    {
        return 'message.unread';
    }
}
