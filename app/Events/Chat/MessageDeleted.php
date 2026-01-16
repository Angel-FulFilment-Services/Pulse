<?php
namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $messageId;
    public $chatType;
    public $chatId;

    public function __construct($messageId, $chatType, $chatId)
    {
        $this->messageId = $messageId;
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
    
    public function broadcastAs()
    {
        return 'MessageDeleted';
    }

    public function broadcastWith()
    {
        return [
            'message_id' => $this->messageId,
        ];
    }
}
