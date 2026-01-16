<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatGame extends Model
{
    protected $connection = 'pulse';
    protected $table = 'chat_games';
    
    protected $fillable = [
        'team_id',
        'game_type',
        'status',
        'started_by',
        'current_player_id',
        'game_data',
        'winner_id',
        'message_id',
        'points_awarded',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'game_data' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the team where the game is played
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get the user who started the game
     */
    public function startedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User\User::class, 'started_by');
    }

    /**
     * Get the current player
     */
    public function currentPlayer(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User\User::class, 'current_player_id');
    }

    /**
     * Get the winner
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User\User::class, 'winner_id');
    }

    /**
     * Get the message associated with the completed game
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Check if game is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if user is the game master (admin/owner who started it)
     */
    public function isGameMaster(int $userId): bool
    {
        return $this->started_by === $userId;
    }

    /**
     * Check if it's the given user's turn
     */
    public function isPlayerTurn(int $userId): bool
    {
        return $this->current_player_id === $userId;
    }

    /**
     * Get active game for a team
     */
    public static function getActiveGame(int $teamId): ?self
    {
        return static::where('team_id', $teamId)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Add a guess to the game data
     */
    public function addGuess(int $userId, string $userName, string $guess, bool $isCorrect): void
    {
        $data = $this->game_data;
        $data['guesses'][] = [
            'user_id' => $userId,
            'user_name' => $userName,
            'guess' => $guess,
            'is_correct' => $isCorrect,
            'timestamp' => now()->toISOString(),
        ];
        $this->game_data = $data;
    }

    /**
     * Add or update a participant in the game data
     */
    public function updateParticipant(int $userId, string $userName, bool $isCorrect): void
    {
        $data = $this->game_data;
        
        if (!isset($data['participants'])) {
            $data['participants'] = [];
        }

        $found = false;
        foreach ($data['participants'] as &$participant) {
            if ($participant['user_id'] === $userId) {
                $participant['guesses_made']++;
                if ($isCorrect) {
                    $participant['correct_guesses']++;
                } else {
                    $participant['wrong_guesses']++;
                }
                $found = true;
                break;
            }
        }

        if (!$found) {
            $data['participants'][] = [
                'user_id' => $userId,
                'user_name' => $userName,
                'guesses_made' => 1,
                'correct_guesses' => $isCorrect ? 1 : 0,
                'wrong_guesses' => $isCorrect ? 0 : 1,
                'points_earned' => 0,
            ];
        }

        $this->game_data = $data;
    }

    /**
     * Award points to a participant
     */
    public function awardPointsToParticipant(int $userId, int $points): void
    {
        $data = $this->game_data;
        
        if (isset($data['participants'])) {
            foreach ($data['participants'] as &$participant) {
                if ($participant['user_id'] === $userId) {
                    $participant['points_earned'] = ($participant['points_earned'] ?? 0) + $points;
                    break;
                }
            }
        }

        $this->game_data = $data;
    }
}
