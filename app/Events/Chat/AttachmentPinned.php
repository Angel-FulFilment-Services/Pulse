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
use App\Models\Chat\MessageAttachment;

class AttachmentPinned implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $attachment;
    public $chatType;
    public $chatId;

    public function __construct(MessageAttachment $attachment, $chatType, $chatId)
    {
        $this->attachment = $attachment;
        $this->chatType = $chatType;
        $this->chatId = $chatId;
    }

    public function broadcastOn()
    {
        if ($this->chatType === 'team') {
            return new PresenceChannel('chat.team.' . $this->chatId);
        } else {
            return new PresenceChannel('chat.dm.' . $this->chatId);
        }
    }

    public function broadcastWith()
    {
        return [
            'attachment' => $this->attachment,
        ];
    }

    public function broadcastAs()
    {
        return 'AttachmentPinned';
    }
}
