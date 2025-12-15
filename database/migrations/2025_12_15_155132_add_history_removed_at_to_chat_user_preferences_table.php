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
        Schema::connection('pulse')->table('chat_user_preferences', function (Blueprint $table) {
            $table->timestamp('history_removed_at')->nullable()->after('last_read_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('chat_user_preferences', function (Blueprint $table) {
            $table->dropColumn('history_removed_at');
        });
    }
};
