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
            // For message forwarding - stores the original message ID that was forwarded
            $table->unsignedBigInteger('forwarded_from_message_id')->nullable()->after('reply_to_attachment_id');
            $table->foreign('forwarded_from_message_id')->references('id')->on('messages')->onDelete('set null');
        });
        
        Schema::connection('pulse')->table('message_attachments', function (Blueprint $table) {
            // For attachment forwarding - stores the original attachment ID that was forwarded
            $table->unsignedBigInteger('forwarded_from_attachment_id')->nullable()->after('deleted_at');
            $table->foreign('forwarded_from_attachment_id')->references('id')->on('message_attachments')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->table('messages', function (Blueprint $table) {
            $table->dropForeign(['forwarded_from_message_id']);
            $table->dropColumn('forwarded_from_message_id');
        });
        
        Schema::connection('pulse')->table('message_attachments', function (Blueprint $table) {
            $table->dropForeign(['forwarded_from_attachment_id']);
            $table->dropColumn('forwarded_from_attachment_id');
        });
    }
};
