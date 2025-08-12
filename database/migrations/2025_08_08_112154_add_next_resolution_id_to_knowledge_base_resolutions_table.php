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
        Schema::connection('pulse')->table('knowledge_base_resolutions', function (Blueprint $table) {
            $table->unsignedBigInteger('next_resolution_id')->nullable()->after('next_question_id');
            $table->foreign('next_resolution_id')->references('id')->on('knowledge_base_resolutions')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('knowledge_base_resolutions', function (Blueprint $table) {
            $table->dropForeign(['next_resolution_id']);
            $table->dropColumn('next_resolution_id');
        });
    }
};
