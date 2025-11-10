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
        Schema::connection('pulse')->create('user_badge_stats', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->primary(); // User ID from main DB
            $table->integer('total_badges')->default(0); // Total badges earned
            $table->integer('total_points')->default(0); // Total points earned
            $table->unsignedBigInteger('current_tier_id')->nullable(); // Current tier based on points
            $table->unsignedBigInteger('highest_tier_reached_id')->nullable(); // Peak tier achievement
            $table->timestamp('badges_refreshed_at')->nullable(); // Last time badges were calculated
            $table->timestamp('last_badge_earned_at')->nullable(); // Most recent badge timestamp
            $table->timestamps();
            
            $table->foreign('current_tier_id')->references('id')->on('badge_tiers')->onDelete('set null');
            $table->foreign('highest_tier_reached_id')->references('id')->on('badge_tiers')->onDelete('set null');
            $table->index('total_points');
            $table->index('badges_refreshed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('user_badge_stats');
    }
};
