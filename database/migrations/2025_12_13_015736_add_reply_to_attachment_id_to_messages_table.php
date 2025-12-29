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
        Schema::connection('pulse')->table('messages', function (Blueprint $table) {
            $table->unsignedBigInteger('reply_to_attachment_id')->nullable()->after('reply_to_message_id');
            $table->foreign('reply_to_attachment_id')->references('id')->on('message_attachments')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('messages', function (Blueprint $table) {
            $table->dropForeign(['reply_to_attachment_id']);
            $table->dropColumn('reply_to_attachment_id');
        });
    }
};
