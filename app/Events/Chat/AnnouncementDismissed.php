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

class AnnouncementDismissed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $announcementData;

    public function __construct(array $announcementData)
    {
        $this->announcementData = $announcementData;
    }

    public function broadcastOn()
    {
        $channels = [];
        
        if ($this->announcementData['scope'] === 'global') {
            // Global announcements dismissal goes to all chat users
            $channels[] = new PrivateChannel('chat.announcements.global');
        } else {
            // Team-specific announcements go to the team channel
            $channels[] = new PresenceChannel('chat.team.' . $this->announcementData['team_id']);
        }
        
        return $channels;
    }

    public function broadcastWith()
    {
        return [
            'announcement_id' => $this->announcementData['id'],
            'scope' => $this->announcementData['scope'],
            'team_id' => $this->announcementData['team_id'],
        ];
    }

    public function broadcastAs()
    {
        return 'AnnouncementDismissed';
    }
}
