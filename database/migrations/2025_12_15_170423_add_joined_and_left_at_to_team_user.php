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
        Schema::connection('pulse')->table('team_user', function (Blueprint $table) {
            $table->timestamp('joined_at')->nullable()->after('role');
            $table->timestamp('left_at')->nullable()->after('joined_at');
        });
        
        // Set joined_at for existing records based on created_at
        \DB::connection('pulse')->table('team_user')
            ->whereNull('joined_at')
            ->update(['joined_at' => \DB::raw('created_at')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('team_user', function (Blueprint $table) {
            $table->dropColumn(['joined_at', 'left_at']);
        });
    }
};
