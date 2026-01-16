<?php

namespace App\Events\Chat;

use App\Models\Chat\ChatGame;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameTurnNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ChatGame $game;
    public int $playerId;

    /**
     * Create a new event instance.
     */
    public function __construct(ChatGame $game, int $playerId)
    {
        $this->game = $game;
        $this->playerId = $playerId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->playerId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'game.your-turn';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'game_id' => $this->game->id,
            'team_id' => $this->game->team_id,
            'game_type' => $this->game->game_type,
            'team_name' => $this->game->team?->name,
            'message' => "It's your turn to play {$this->game->game_type}!",
        ];
    }
}
