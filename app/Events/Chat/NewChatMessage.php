<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Chat\Message;
use App\Models\User\User;

class NewChatMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $message;
    public $sender;

    /**
     * Create a new event instance.
     *
     * @param int $userId The user who should receive this notification
     * @param Message $message The message that was sent
     * @param User $sender The user who sent the message
     */
    public function __construct(int $userId, Message $message, User $sender)
    {
        $this->userId = $userId;
        $this->message = $message;
        $this->sender = $sender;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn()
    {
        return new PrivateChannel('chat.user.' . $this->userId);
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith()
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'body' => $this->message->body,
                'team_id' => $this->message->team_id,
                'team_name' => $this->message->team?->name,
                'sender_id' => $this->message->sender_id,
                'recipient_id' => $this->message->recipient_id,
                'created_at' => $this->message->created_at->toISOString(),
                'attachments' => $this->message->attachments?->map(function ($att) {
                    return [
                        'id' => $att->id,
                        'file_name' => $att->file_name,
                        'type' => $att->type,
                        'mime_type' => $att->mime_type,
                    ];
                })->toArray() ?? [],
            ],
            'sender' => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'profile_photo_url' => $this->sender->profile_photo_url ?? null,
            ],
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs()
    {
        return 'NewChatMessage';
    }
}
