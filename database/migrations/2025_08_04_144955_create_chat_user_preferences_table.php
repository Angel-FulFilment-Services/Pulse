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
        Schema::connection('pulse')->create('chat_user_preferences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('chat_id'); // team_id or user_id depending on chat_type
            $table->enum('chat_type', ['team', 'user']);
            $table->boolean('is_muted')->default(false);
            $table->boolean('is_hidden')->default(false);
            $table->boolean('is_unread')->default(false);
            $table->timestamp('last_read_at')->nullable();
            $table->timestamps();
            
            // Ensure unique preference per user per chat
            $table->unique(['user_id', 'chat_id', 'chat_type']);
            
            // Add indexes for better performance
            $table->index(['user_id', 'chat_type']);
            $table->index(['user_id', 'is_hidden']);
            $table->index(['user_id', 'is_muted']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('chat_user_preferences');
    }
};
