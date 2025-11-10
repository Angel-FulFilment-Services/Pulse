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
        Schema::connection('pulse')->create('badge_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // User ID from main DB
            $table->unsignedBigInteger('badge_id')->nullable(); // Badge ID if specific badge action
            $table->string('event_type'); // 'awarded', 'revoked', 'progress_updated', 'tier_changed'
            $table->text('old_value')->nullable(); // JSON encoded old value
            $table->text('new_value')->nullable(); // JSON encoded new value
            $table->text('metadata')->nullable(); // Additional context as JSON
            $table->timestamp('created_at')->useCurrent();
            
            $table->foreign('badge_id')->references('id')->on('badges')->onDelete('cascade');
            $table->index(['user_id', 'created_at']);
            $table->index('event_type');
            $table->index('badge_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('badge_history');
    }
};
