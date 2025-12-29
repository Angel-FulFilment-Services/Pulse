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
use App\Models\Chat\Announcement;

class AnnouncementCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $announcement;

    public function __construct(Announcement $announcement)
    {
        $this->announcement = $announcement;
    }

    public function broadcastOn()
    {
        $channels = [];
        
        if ($this->announcement->scope === 'global') {
            // Global announcements go to all chat users via a global channel
            $channels[] = new PrivateChannel('chat.announcements.global');
        } else {
            // Team-specific announcements go to the team channel
            $channels[] = new PresenceChannel('chat.team.' . $this->announcement->team_id);
        }
        
        return $channels;
    }

    public function broadcastWith()
    {
        return [
            'announcement' => [
                'id' => $this->announcement->id,
                'message' => $this->announcement->message,
                'scope' => $this->announcement->scope,
                'team_id' => $this->announcement->team_id,
                'expires_at' => $this->announcement->expires_at?->toISOString(),
                'created_at' => $this->announcement->created_at->toISOString(),
                'creator' => $this->announcement->creator ? [
                    'id' => $this->announcement->creator->id,
                    'name' => $this->announcement->creator->name,
                ] : null,
            ],
        ];
    }

    public function broadcastAs()
    {
        return 'AnnouncementCreated';
    }
}
