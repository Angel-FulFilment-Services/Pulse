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
            $table->integer('read_time')->nullable()->comment('Estimated read time in minutes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('knowledge_base_articles', function (Blueprint $table) {
            $table->dropColumn('read_time');
        });
    }
};
