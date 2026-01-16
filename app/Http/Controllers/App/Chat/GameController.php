<?php

namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use App\Models\Chat\ChatGame;
use App\Models\Chat\Team;
use App\Models\Chat\Message;
use App\Events\Chat\GameUpdated;
use App\Events\Chat\GameTurnNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    /**
     * Get active game for a team
     */
    public function getActiveGame(Request $request, $teamId)
    {
        $game = ChatGame::with(['currentPlayer', 'startedBy', 'winner'])
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->first();

        if (!$game) {
            return response()->json(['game' => null]);
        }

        return response()->json([
            'game' => $this->formatGameResponse($game)
        ]);
    }

    /**
     * Start a new hangman game
     */
    public function startHangman(Request $request, $teamId)
    {
        $request->validate([
            'word' => 'required|string|min:2|max:50|regex:/^[a-zA-Z]+$/',
        ]);

        $userId = auth()->user()->id;
        $userName = auth()->user()->name;
        $team = Team::findOrFail($teamId);

        // Check if user is admin or owner
        if (!$this->isAdminOrOwner($teamId, $userId)) {
            return response()->json(['error' => 'Only admins or owners can start games'], 403);
        }

        // Check if there's already an active game
        $existingGame = ChatGame::getActiveGame($teamId);
        if ($existingGame) {
            return response()->json(['error' => 'A game is already in progress'], 400);
        }

        $word = strtoupper(trim($request->input('word')));

        $game = ChatGame::create([
            'team_id' => $teamId,
            'game_type' => 'hangman',
            'status' => 'active',
            'started_by' => $userId,
            'current_player_id' => null, // No player selected yet - game master will choose
            'game_data' => [
                'word' => $word,
                'guessed_letters' => [],
                'wrong_guesses' => 0,
                'max_wrong_guesses' => 6, // Head, body, 2 arms, 2 legs
                'revealed' => str_repeat('_', strlen($word)),
                'participants' => [],
                'guesses' => [],
                'awaiting_first_player' => true, // Flag to indicate game master needs to select first player
            ],
            'started_at' => now(),
        ]);

        $game->load(['startedBy']);

        // Broadcast game started
        broadcast(new GameUpdated($game, 'started'))->toOthers();

        return response()->json([
            'game' => $this->formatGameResponse($game),
            'message' => 'Hangman game started!'
        ]);
    }

    /**
     * Make a guess in the game
     */
    public function makeGuess(Request $request, $teamId, $gameId)
    {
        $request->validate([
            'guess' => 'required|string|max:50',
        ]);

        $userId = auth()->user()->id;
        $userName = auth()->user()->name;
        $game = ChatGame::findOrFail($gameId);

        // Verify game belongs to team and is active
        if ($game->team_id != $teamId || !$game->isActive()) {
            return response()->json(['error' => 'Invalid game'], 400);
        }

        // Verify it's the user's turn
        if (!$game->isPlayerTurn($userId)) {
            return response()->json(['error' => 'It\'s not your turn'], 403);
        }

        $guess = strtoupper(trim($request->input('guess')));
        $data = $game->game_data;
        $word = $data['word'];
        $isCorrect = false;

        // Determine if it's a letter or word guess
        if (strlen($guess) === 1) {
            // Letter guess
            if (in_array($guess, $data['guessed_letters'])) {
                return response()->json(['error' => 'Letter already guessed'], 400);
            }

            $data['guessed_letters'][] = $guess;

            if (strpos($word, $guess) !== false) {
                // Correct letter - award 1 point
                $isCorrect = true;
                $this->updateUserPoints($userId, 1);
                
                // Update revealed word
                $revealed = '';
                for ($i = 0; $i < strlen($word); $i++) {
                    if (in_array($word[$i], $data['guessed_letters'])) {
                        $revealed .= $word[$i];
                    } else {
                        $revealed .= '_';
                    }
                }
                $data['revealed'] = $revealed;
            } else {
                // Wrong letter
                $data['wrong_guesses']++;
            }
        } else {
            // Word guess
            if ($guess === $word) {
                $isCorrect = true;
                $data['revealed'] = $word;
            } else {
                $data['wrong_guesses']++;
            }
        }

        // Record the guess
        $data['guesses'][] = [
            'user_id' => $userId,
            'user_name' => $userName,
            'guess' => $guess,
            'is_correct' => $isCorrect,
            'timestamp' => now()->toISOString(),
        ];

        // Update participant stats
        $participantFound = false;
        foreach ($data['participants'] as &$participant) {
            if ($participant['user_id'] === $userId) {
                $participant['guesses_made']++;
                if ($isCorrect) {
                    $participant['correct_guesses']++;
                    // Award 1 point for correct letter guess (tracked in game_data)
                    if (strlen($guess) === 1) {
                        $participant['points_earned'] = ($participant['points_earned'] ?? 0) + 1;
                    }
                } else {
                    $participant['wrong_guesses']++;
                }
                $participantFound = true;
                break;
            }
        }

        if (!$participantFound) {
            $data['participants'][] = [
                'user_id' => $userId,
                'user_name' => $userName,
                'guesses_made' => 1,
                'correct_guesses' => $isCorrect ? 1 : 0,
                'wrong_guesses' => $isCorrect ? 0 : 1,
                'points_earned' => 0,
            ];
        }

        // Check for game end conditions
        $gameEnded = false;
        $won = false;

        if ($data['revealed'] === $word) {
            // Word fully revealed - player wins
            $gameEnded = true;
            $won = true;
        } elseif ($data['wrong_guesses'] >= $data['max_wrong_guesses']) {
            // Man is hung - game over
            $gameEnded = true;
            $won = false;
        }

        $game->game_data = $data;

        if ($gameEnded) {
            $game->status = 'completed';
            $game->completed_at = now();
            
            if ($won) {
                $game->winner_id = $userId;
                $game->points_awarded = 10; // Base points for winning

                // Update participant points in game_data
                $data = $game->game_data;
                foreach ($data['participants'] as &$participant) {
                    if ($participant['user_id'] === $userId) {
                        $participant['points_earned'] = 10;
                        break;
                    }
                }
                $game->game_data = $data;

                // Update global points
                $this->updateUserPoints($userId, 10);
            }

            $game->save();

            $game->load(['currentPlayer', 'startedBy', 'winner']);
            broadcast(new GameUpdated($game, 'completed'))->toOthers();
        } else {
            // Release the turn - game master must select next player
            $game->current_player_id = null;
            
            // Update game_data to indicate awaiting next player selection
            $data = $game->game_data;
            $data['awaiting_first_player'] = true;
            $game->game_data = $data;
            
            $game->save();
            $game->load(['currentPlayer', 'startedBy']);
            broadcast(new GameUpdated($game, 'guess_made'))->toOthers();
        }

        return response()->json([
            'game' => $this->formatGameResponse($game),
            'guess_result' => [
                'guess' => $guess,
                'is_correct' => $isCorrect,
                'game_ended' => $gameEnded,
                'won' => $won,
            ]
        ]);
    }

    /**
     * Select next player (admin/owner only)
     */
    public function selectNextPlayer(Request $request, $teamId, $gameId)
    {
        $request->validate([
            'player_id' => 'required|integer',
        ]);

        $userId = auth()->user()->id;
        $game = ChatGame::findOrFail($gameId);

        // Verify game belongs to team and is active
        if ($game->team_id != $teamId || !$game->isActive()) {
            return response()->json(['error' => 'Invalid game'], 400);
        }

        // Only game master can select next player
        if (!$game->isGameMaster($userId)) {
            return response()->json(['error' => 'Only the game master can select the next player'], 403);
        }

        $nextPlayerId = $request->input('player_id');

        // Verify player is a team member
        $nextPlayer = $this->getTeamMember($teamId, $nextPlayerId);
        if (!$nextPlayer) {
            return response()->json(['error' => 'Selected player is not a team member'], 400);
        }

        // Add player as participant if not already
        $data = $game->game_data;
        $participantExists = collect($data['participants'] ?? [])->contains('user_id', $nextPlayerId);
        
        if (!$participantExists) {
            $data['participants'][] = [
                'user_id' => $nextPlayerId,
                'user_name' => $nextPlayer->name,
                'guesses_made' => 0,
                'correct_guesses' => 0,
                'wrong_guesses' => 0,
                'points_earned' => 0,
            ];
        }

        // Clear the awaiting_first_player flag if it was set
        if (isset($data['awaiting_first_player'])) {
            unset($data['awaiting_first_player']);
        }
        
        $game->game_data = $data;
        $game->current_player_id = $nextPlayerId;
        $game->save();

        $game->load(['currentPlayer', 'startedBy']);

        // Broadcast update
        broadcast(new GameUpdated($game, 'player_changed'))->toOthers();

        // Notify the next player
        event(new GameTurnNotification($game, $nextPlayerId));

        return response()->json([
            'game' => $this->formatGameResponse($game),
            'message' => 'Next player selected'
        ]);
    }

    /**
     * Cancel an active game (admin/owner only)
     */
    public function cancelGame(Request $request, $teamId, $gameId)
    {
        $userId = auth()->user()->id;
        $game = ChatGame::findOrFail($gameId);

        // Verify game belongs to team and is active
        if ($game->team_id != $teamId || !$game->isActive()) {
            return response()->json(['error' => 'Invalid game'], 400);
        }

        // Only game master or team admin/owner can cancel
        if (!$game->isGameMaster($userId) && !$this->isAdminOrOwner($teamId, $userId)) {
            return response()->json(['error' => 'Not authorized to cancel this game'], 403);
        }

        $game->status = 'cancelled';
        $game->completed_at = now();
        $game->save();

        broadcast(new GameUpdated($game, 'cancelled'))->toOthers();

        return response()->json([
            'message' => 'Game cancelled'
        ]);
    }

    /**
     * Get game history for a team
     */
    public function getGameHistory(Request $request, $teamId)
    {
        $games = ChatGame::with(['startedBy', 'winner'])
            ->where('team_id', $teamId)
            ->whereIn('status', ['completed', 'cancelled'])
            ->orderBy('completed_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'games' => $games->map(fn($game) => $this->formatGameResponse($game, false))
        ]);
    }

    /**
     * Get completed games for chat timeline display
     */
    public function getCompletedGames(Request $request, $teamId)
    {
        $games = ChatGame::with(['startedBy', 'winner'])
            ->where('team_id', $teamId)
            ->where('status', 'completed')
            ->orderBy('completed_at', 'asc')
            ->get();

        return response()->json([
            'games' => $games->map(fn($game) => $this->formatGameResponse($game, false))
        ]);
    }

    /**
     * Get leaderboard for a team based on game_data JSON
     */
    public function getLeaderboard(Request $request, $teamId)
    {
        $games = ChatGame::where('team_id', $teamId)
            ->where('status', 'completed')
            ->get();

        // Aggregate scores from game_data JSON
        $scores = [];
        foreach ($games as $game) {
            $participants = $game->game_data['participants'] ?? [];
            foreach ($participants as $participant) {
                $userId = $participant['user_id'];
                if (!isset($scores[$userId])) {
                    $scores[$userId] = [
                        'user_id' => $userId,
                        'user_name' => $participant['user_name'],
                        'total_points' => 0,
                        'games_played' => 0,
                        'total_correct' => 0,
                        'total_wrong' => 0,
                    ];
                }
                $scores[$userId]['total_points'] += $participant['points_earned'] ?? 0;
                $scores[$userId]['games_played']++;
                $scores[$userId]['total_correct'] += $participant['correct_guesses'] ?? 0;
                $scores[$userId]['total_wrong'] += $participant['wrong_guesses'] ?? 0;
            }
        }

        // Sort by total points
        $leaderboard = collect($scores)->sortByDesc('total_points')->values()->take(10);

        return response()->json(['leaderboard' => $leaderboard]);
    }

    /**
     * Format game response for API
     */
    private function formatGameResponse(ChatGame $game, bool $hideWord = true): array
    {
        $data = $game->game_data;
        $userId = auth()->user()?->id;
        
        // Hide the actual word from non-game-masters during active games
        // Game master (started_by) can always see the word
        if ($hideWord && $game->isActive() && isset($data['word']) && $game->started_by !== $userId) {
            unset($data['word']);
        }

        return [
            'id' => $game->id,
            'team_id' => $game->team_id,
            'game_type' => $game->game_type,
            'status' => $game->status,
            'started_by' => $game->started_by,
            'started_by_user' => $game->startedBy ? [
                'id' => $game->startedBy->id,
                'name' => $game->startedBy->name,
            ] : null,
            'current_player_id' => $game->current_player_id,
            'current_player' => $game->currentPlayer ? [
                'id' => $game->currentPlayer->id,
                'name' => $game->currentPlayer->name,
            ] : null,
            'game_data' => $data,
            'winner_id' => $game->winner_id,
            'winner' => $game->winner ? [
                'id' => $game->winner->id,
                'name' => $game->winner->name,
            ] : null,
            'points_awarded' => $game->points_awarded,
            'message_id' => $game->message_id,
            'started_at' => $game->started_at?->toISOString(),
            'completed_at' => $game->completed_at?->toISOString(),
        ];
    }

    /**
     * Check if user is admin or owner of the team
     */
    private function isAdminOrOwner(int $teamId, int $userId): bool
    {
        $membership = DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->first();

        return $membership && in_array($membership->role, ['admin', 'owner']);
    }

    /**
     * Get team member details if they are a member
     */
    private function getTeamMember(int $teamId, int $userId)
    {
        $isMember = DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->exists();

        if (!$isMember) {
            return null;
        }

        return \App\Models\User\User::find($userId);
    }

    /**
     * Update user's global points
     */
    private function updateUserPoints(int $userId, int $points): void
    {
        DB::connection('pulse')->table('user_statuses')
            ->updateOrInsert(
                ['user_id' => $userId],
                [
                    'total_points' => DB::raw("COALESCE(total_points, 0) + {$points}"),
                    'updated_at' => now(),
                ]
            );
    }

}
