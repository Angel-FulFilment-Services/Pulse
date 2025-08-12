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
            $table->unsignedBigInteger('next_question_id')->nullable()->after('image');
            $table->foreign('next_question_id')->references('id')->on('knowledge_base_questions')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('knowledge_base_resolutions', function (Blueprint $table) {
            $table->dropForeign(['next_question_id']);
            $table->dropColumn('next_question_id');
        });
    }
};
