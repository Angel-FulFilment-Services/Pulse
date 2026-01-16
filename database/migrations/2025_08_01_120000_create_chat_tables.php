<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Teams (group chats)
        Schema::connection('pulse')->create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('owner_id');
            $table->timestamps();
        });

        // Team members (pivot)
        Schema::connection('pulse')->create('team_user', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('team_id');
            $table->unsignedBigInteger('user_id');
            $table->string('role')->default('member');
            $table->timestamps();
        });

        // Messages
        Schema::connection('pulse')->create('messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('team_id')->nullable(); // null for direct messages
            $table->unsignedBigInteger('sender_id');
            $table->unsignedBigInteger('recipient_id')->nullable(); // for direct messages
            $table->text('body')->nullable();
            $table->json('mentions')->nullable();
            $table->enum('type', ['text', 'file', 'image', 'system'])->default('text');
            $table->boolean('is_edited')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        // Message attachments
        Schema::connection('pulse')->create('message_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('message_id');
            $table->string('file_path');
            $table->string('file_type');
            $table->string('file_name');
            $table->unsignedBigInteger('uploaded_by');
            $table->timestamps();
        });

        // Message reads (read receipts)
        Schema::connection('pulse')->create('message_reads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('message_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        // User activity status
        Schema::connection('pulse')->create('user_statuses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->enum('status', ['online', 'offline', 'away', 'dnd'])->default('offline');
            $table->timestamp('last_active_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('user_statuses');
        Schema::connection('pulse')->dropIfExists('message_reads');
        Schema::connection('pulse')->dropIfExists('message_attachments');
        Schema::connection('pulse')->dropIfExists('messages');
        Schema::connection('pulse')->dropIfExists('team_user');
        Schema::connection('pulse')->dropIfExists('teams');
    }
};
