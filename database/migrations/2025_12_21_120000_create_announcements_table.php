<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Announcements table
        Schema::connection('pulse')->create('announcements', function (Blueprint $table) {
            $table->id();
            $table->text('message');
            $table->unsignedBigInteger('created_by'); // User who created the announcement
            $table->enum('scope', ['global', 'team'])->default('team'); // global = all chats, team = specific team
            $table->unsignedBigInteger('team_id')->nullable(); // Only set for team-scoped announcements
            $table->timestamp('expires_at')->nullable(); // When the announcement should auto-dismiss
            $table->timestamps();
            
            // Indexes
            $table->index('scope');
            $table->index('team_id');
            $table->index('expires_at');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('announcements');
    }
};
