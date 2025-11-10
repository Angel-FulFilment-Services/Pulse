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
        Schema::connection('pulse')->create('badge_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // "Bronze", "Silver", "Gold", "Platinum"
            $table->string('slug')->unique(); // "bronze", "silver", "gold", "platinum"
            $table->integer('min_points')->default(0); // Points needed to reach this tier
            $table->string('color')->nullable(); // Hex color for tier
            $table->string('image_url')->nullable(); // Image for tier
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index('min_points');
            $table->index('sort_order');
        });

        // Insert default tiers
        DB::connection('pulse')->table('badge_tiers')->insert([
            ['name' => 'Bronze', 'slug' => 'bronze', 'min_points' => 0, 'color' => '#CD7F32', 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Silver', 'slug' => 'silver', 'min_points' => 100, 'color' => '#C0C0C0', 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Gold', 'slug' => 'gold', 'min_points' => 500, 'color' => '#FFD700', 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Platinum', 'slug' => 'platinum', 'min_points' => 1000, 'color' => '#E5E4E2', 'sort_order' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Emerald', 'slug' => 'emerald', 'min_points' => 2500, 'color' => '#50C878', 'sort_order' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ruby', 'slug' => 'ruby', 'min_points' => 5000, 'color' => '#E0115F', 'sort_order' => 6, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Diamond', 'slug' => 'diamond', 'min_points' => 10000, 'color' => '#B9F2FF', 'sort_order' => 7, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Alexandrite', 'slug' => 'alexandrite', 'min_points' => 25000, 'color' => '#4B0082', 'sort_order' => 8, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('badge_tiers');
    }
};
