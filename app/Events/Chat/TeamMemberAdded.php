<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TeamMemberAdded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $team;

    /**
     * Create a new event instance.
     */
    public function __construct(int $userId, array $team)
    {
        $this->userId = $userId;
        $this->team = $team;
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
            'team' => $this->team,
        ];
    }

    public function broadcastAs(): string
    {
        return 'TeamMemberAdded';
    }
}
