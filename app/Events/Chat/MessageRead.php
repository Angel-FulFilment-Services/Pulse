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

    public $messageReads;

    public function __construct($messageReads)
    {
        // Accept either single MessageRead or array of MessageReads
        $this->messageReads = is_array($messageReads) ? $messageReads : [$messageReads];
    }

    public function broadcastOn()
    {
        // Collect unique user IDs to notify
        $userIds = [];
        foreach ($this->messageReads as $read) {
            $userIds[] = $read->user_id;
            $userIds[] = $read->message->sender_id;
        }
        $userIds = array_unique($userIds);
        
        // Create private channels for all affected users
        return array_map(function($userId) {
            return new PrivateChannel('chat.user.' . $userId);
        }, $userIds);
    }

    public function broadcastWith()
    {
        return [
            'message_reads' => array_map(fn($read) => $read->toArray(), $this->messageReads),
        ];
    }

    public function broadcastAs()
    {
        return 'MessageRead';
    }
}
