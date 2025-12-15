<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TeamMemberRoleChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $teamId;
    public $userId;
    public $userName;
    public $oldRole;
    public $newRole;
    public $newOwnerId;

    /**
     * Create a new event instance.
     */
    public function __construct(int $teamId, int $userId, string $userName, string $oldRole, string $newRole, ?int $newOwnerId = null)
    {
        $this->teamId = $teamId;
        $this->userId = $userId;
        $this->userName = $userName;
        $this->oldRole = $oldRole;
        $this->newRole = $newRole;
        $this->newOwnerId = $newOwnerId;
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
            'old_role' => $this->oldRole,
            'new_role' => $this->newRole,
            'new_owner_id' => $this->newOwnerId,
        ];
    }

    public function broadcastAs(): string
    {
        return 'TeamMemberRoleChanged';
    }
}
