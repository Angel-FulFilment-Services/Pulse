<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TeamMemberJoined implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $teamId;
    public $userId;
    public $userName;
    public $joinedAt;

    /**
     * Create a new event instance.
     */
    public function __construct(int $teamId, int $userId, string $userName, string $joinedAt)
    {
        $this->teamId = $teamId;
        $this->userId = $userId;
        $this->userName = $userName;
        $this->joinedAt = $joinedAt;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('chat.team.' . $this->teamId),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'team_id' => $this->teamId,
            'user_id' => $this->userId,
            'user_name' => $this->userName,
            'joined_at' => $this->joinedAt,
            'type' => 'member_joined',
        ];
    }

    public function broadcastAs(): string
    {
        return 'TeamMemberJoined';
    }
}
