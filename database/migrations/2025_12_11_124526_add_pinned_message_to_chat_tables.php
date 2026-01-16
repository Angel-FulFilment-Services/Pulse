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
        Schema::connection('pulse')->table('teams', function (Blueprint $table) {
            $table->unsignedBigInteger('pinned_message_id')->nullable()->after('owner_id');
            $table->foreign('pinned_message_id')->references('id')->on('messages')->onDelete('set null');
        });
        
        // For DM conversations, we need a separate table to track pinned messages per conversation pair
        Schema::connection('pulse')->create('dm_pinned_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id_1'); // Lower user ID
            $table->unsignedBigInteger('user_id_2'); // Higher user ID
            $table->unsignedBigInteger('pinned_message_id')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id_1', 'user_id_2']);
            $table->foreign('pinned_message_id')->references('id')->on('messages')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('dm_pinned_messages');
        
        Schema::connection('pulse')->table('teams', function (Blueprint $table) {
            $table->dropForeign(['pinned_message_id']);
            $table->dropColumn('pinned_message_id');
        });
    }
};
