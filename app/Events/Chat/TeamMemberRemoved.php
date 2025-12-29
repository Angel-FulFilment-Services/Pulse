<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TeamMemberRemoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $teamId;

    /**
     * Create a new event instance.
     */
    public function __construct(int $userId, int $teamId)
    {
        $this->userId = $userId;
        $this->teamId = $teamId;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // Broadcast to the specific user's channel
        return [
            new PrivateChannel('chat.user.' . $this->userId),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'team_id' => $this->teamId,
        ];
    }

    public function broadcastAs(): string
    {
        return 'TeamMemberRemoved';
    }
}
