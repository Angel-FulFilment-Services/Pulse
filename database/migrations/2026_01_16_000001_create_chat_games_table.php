<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Chat games table - stores active and completed games
        // All game-specific data (guesses, participants, scores) stored in JSON
        Schema::connection('pulse')->create('chat_games', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('team_id'); // The team/group where the game is played
            $table->string('game_type', 50); // 'hangman', 'trivia', 'wordle', etc.
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->unsignedBigInteger('started_by'); // Admin/Owner who started the game
            $table->unsignedBigInteger('current_player_id')->nullable(); // Whose turn it is
            $table->json('game_data'); // All game-specific data: state, guesses, participants, scores, etc.
            $table->unsignedBigInteger('winner_id')->nullable(); // Who won (if applicable)
            $table->unsignedBigInteger('message_id')->nullable(); // Link to message once game completes
            $table->integer('points_awarded')->default(0); // Points given to winner
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index(['team_id', 'status']);
            $table->index('current_player_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('chat_games');
    }
};
