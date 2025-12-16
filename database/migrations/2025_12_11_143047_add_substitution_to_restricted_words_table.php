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
            $table->string('substitution')->nullable()->after('level')->comment('Optional replacement text for the word');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('restricted_words', function (Blueprint $table) {
            $table->dropColumn('substitution');
        });
    }
};
