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
        Schema::connection('pulse')->table('knowledge_base_articles', function (Blueprint $table) {
            $table->json('soundfiles')->nullable()->after('body');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('knowledge_base_articles', function (Blueprint $table) {
            $table->dropColumn('soundfiles');
        });
    }
};
