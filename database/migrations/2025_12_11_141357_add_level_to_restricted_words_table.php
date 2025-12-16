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
        Schema::connection('pulse')->table('restricted_words', function (Blueprint $table) {
            $table->tinyInteger('level')->default(1)->after('category')->comment('1=star out, 2=remove word, 3=block message');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('restricted_words', function (Blueprint $table) {
            $table->dropColumn('level');
        });
    }
};
