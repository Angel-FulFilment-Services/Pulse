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
        Schema::connection('pulse')->create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image_url')->nullable(); // Full image path/URL for badge
            $table->string('category'); // 'signs', 'dialings', 'quality', etc.
            $table->string('tier'); // bronze, silver, gold, platinum
            $table->json('criteria_query'); // Store query logic as JSON
            $table->integer('threshold'); // The count needed to earn badge
            $table->integer('points')->default(0); // Points value of badge
            $table->integer('sort_order')->default(0); // Display order
            $table->boolean('is_active')->default(true);
            $table->boolean('is_secret')->default(false); // Hidden until earned
            $table->unsignedBigInteger('prerequisite_badge_id')->nullable(); // Must earn this badge first
            $table->integer('expires_after_days')->nullable(); // Auto-revoke after X days
            $table->integer('max_awards')->nullable(); // Limit awards (null = unlimited)
            $table->json('display_condition')->nullable(); // When to show badge to users
            $table->boolean('repeatable')->default(false); // Can be earned multiple times
            $table->timestamps();
            
            $table->index('category');
            $table->index('is_active');
            $table->index('tier');
            $table->index('sort_order');
            $table->foreign('prerequisite_badge_id')->references('id')->on('badges')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('badges');
    }
};
