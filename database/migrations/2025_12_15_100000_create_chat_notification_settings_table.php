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
        if (!Schema::connection('pulse')->hasTable('chat_notification_settings')) {
            Schema::connection('pulse')->create('chat_notification_settings', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->unique();
                $table->boolean('global_mute')->default(false);
                $table->boolean('global_hide_preview')->default(false);
                $table->timestamps();
                
                $table->index('user_id');
            });
        }
        
        // Add hide_preview column to chat_user_preferences if it doesn't exist
        if (!Schema::connection('pulse')->hasColumn('chat_user_preferences', 'hide_preview')) {
            Schema::connection('pulse')->table('chat_user_preferences', function (Blueprint $table) {
                $table->boolean('hide_preview')->default(false)->after('is_muted');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('chat_notification_settings');
        
        Schema::connection('pulse')->table('chat_user_preferences', function (Blueprint $table) {
            $table->dropColumn('hide_preview');
        });
    }
};
