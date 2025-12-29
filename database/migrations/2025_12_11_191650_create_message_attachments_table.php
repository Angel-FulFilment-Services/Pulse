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
        Schema::connection('pulse')->create('message_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('message_id');
            $table->string('file_name');
            $table->string('file_type', 50); // e.g., 'image', 'pdf', 'video', 'audio', 'document'
            $table->integer('file_size'); // in bytes
            $table->string('mime_type', 100);
            $table->string('storage_path');
            $table->string('thumbnail_path')->nullable();
            $table->boolean('is_image')->default(false);
            $table->string('storage_driver', 20)->default('r2'); // 'r2' or 'local'
            $table->timestamps();
            
            // Index for performance
            $table->index('message_id');
            
            // Foreign key
            $table->foreign('message_id')
                  ->references('id')
                  ->on('messages')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('message_attachments');
    }
};
