<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'pulse';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('pulse')->create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('badge_id');
            $table->timestamp('awarded_at');
            $table->integer('progress_value')->nullable(); // Store the count when earned
            $table->timestamp('notification_sent_at')->nullable(); // Track notification status
            $table->timestamp('viewed_at')->nullable(); // When user first saw badge (for "NEW" indicator)
            $table->integer('rank')->nullable(); // Position in leaderboard when earned (if applicable)
            $table->timestamp('expires_at')->nullable(); // For time-limited badges
            $table->timestamp('revoked_at')->nullable(); // If badge is removed
            $table->text('award_reason')->nullable(); // Reason for admin-awarded badges
            $table->timestamps();
            
            $table->unique(['user_id', 'badge_id']);
            $table->index('user_id');
            $table->index('badge_id');
            $table->index('awarded_at');
            $table->index('viewed_at');
            
            $table->foreign('badge_id')->references('id')->on('badges')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('user_badges');
    }
};
