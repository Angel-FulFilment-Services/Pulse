<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\SerializesModels;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels as QueueSerializesModels;

class Typing implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels, QueueSerializesModels;

    public $userId;
    public $userName;
    public $teamId;

    public function __construct($userId, $userName, $teamId)
    {
        $this->userId = $userId;
        $this->userName = $userName;
        $this->teamId = $teamId;
    }

    public function broadcastOn()
    {
        return new PresenceChannel('chat.team.' . $this->teamId);
    }

    public function broadcastWith()
    {
        return [
            'user_id' => $this->userId,
            'user_name' => $this->userName,
            'team_id' => $this->teamId,
        ];
    }

    public function broadcastAs()
    {
        return 'Typing';
    }
}
