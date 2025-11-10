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
        Schema::connection('pulse')->create('user_badge_progress', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('badge_id');
            $table->integer('current_count')->default(0);
            $table->decimal('percentage', 5, 2)->default(0); // Pre-calculated percentage
            $table->timestamp('started_at')->nullable(); // When they first made progress
            $table->timestamp('last_checked_at')->nullable();
            $table->json('milestone_hit')->nullable(); // Array of milestones reached
            $table->timestamps();
            
            $table->primary(['user_id', 'badge_id']);
            $table->index('last_checked_at');
            $table->index('percentage');
            
            $table->foreign('badge_id')->references('id')->on('badges')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('user_badge_progress');
    }
};
