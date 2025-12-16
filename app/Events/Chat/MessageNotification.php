<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageNotification implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sender_id;
    public $timestamp;
    public $channelName;

    public function __construct($sender_id, $timestamp, $channelName)
    {
        $this->sender_id = $sender_id;
        $this->timestamp = $timestamp;
        $this->channelName = $channelName;
    }

    public function broadcastOn()
    {
        return new PresenceChannel($this->channelName);
    }

    public function broadcastWith()
    {
        return [
            'sender_id' => $this->sender_id,
            'timestamp' => $this->timestamp,
        ];
    }

    public function broadcastAs()
    {
        return 'MessageNotification';
    }
}
