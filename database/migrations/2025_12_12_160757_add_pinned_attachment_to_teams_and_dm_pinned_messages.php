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
            $table->unsignedBigInteger('pinned_attachment_id')->nullable()->after('pinned_message_id');
            $table->foreign('pinned_attachment_id')->references('id')->on('message_attachments')->onDelete('set null');
        });

        Schema::connection('pulse')->table('dm_pinned_messages', function (Blueprint $table) {
            $table->unsignedBigInteger('pinned_attachment_id')->nullable()->after('pinned_message_id');
            $table->foreign('pinned_attachment_id')->references('id')->on('message_attachments')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('teams', function (Blueprint $table) {
            $table->dropForeign(['pinned_attachment_id']);
            $table->dropColumn('pinned_attachment_id');
        });

        Schema::connection('pulse')->table('dm_pinned_messages', function (Blueprint $table) {
            $table->dropForeign(['pinned_attachment_id']);
            $table->dropColumn('pinned_attachment_id');
        });
    }
};
