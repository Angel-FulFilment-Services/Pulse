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

class GameUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ChatGame $game;
    public string $action;

    /**
     * Create a new event instance.
     *
     * @param ChatGame $game
     * @param string $action - started, guess_made, player_changed, completed, cancelled
     */
    public function __construct(ChatGame $game, string $action)
    {
        $this->game = $game;
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('team.' . $this->game->team_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'game.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        $data = $this->game->game_data;
        
        // Hide the word from broadcast during active games
        if ($this->game->isActive() && isset($data['word'])) {
            unset($data['word']);
        }

        return [
            'action' => $this->action,
            'game' => [
                'id' => $this->game->id,
                'team_id' => $this->game->team_id,
                'game_type' => $this->game->game_type,
                'status' => $this->game->status,
                'started_by' => $this->game->started_by,
                'started_by_user' => $this->game->startedBy ? [
                    'id' => $this->game->startedBy->id,
                    'name' => $this->game->startedBy->name,
                ] : null,
                'current_player_id' => $this->game->current_player_id,
                'current_player' => $this->game->currentPlayer ? [
                    'id' => $this->game->currentPlayer->id,
                    'name' => $this->game->currentPlayer->name,
                ] : null,
                'game_data' => $data,
                'winner_id' => $this->game->winner_id,
                'winner' => $this->game->winner ? [
                    'id' => $this->game->winner->id,
                    'name' => $this->game->winner->name,
                ] : null,
                'points_awarded' => $this->game->points_awarded,
                'message_id' => $this->game->message_id,
                'started_at' => $this->game->started_at?->toISOString(),
                'completed_at' => $this->game->completed_at?->toISOString(),
            ],
        ];
    }
}
