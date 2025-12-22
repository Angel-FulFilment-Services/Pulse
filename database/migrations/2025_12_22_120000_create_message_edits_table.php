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
        Schema::connection('pulse')->create('message_edits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('message_id');
            $table->text('body'); // The previous body content before edit
            $table->timestamps();
            
            $table->foreign('message_id')->references('id')->on('messages')->onDelete('cascade');
            $table->index('message_id');
        });
        
        // Add edited_at timestamp to messages table
        Schema::connection('pulse')->table('messages', function (Blueprint $table) {
            $table->timestamp('edited_at')->nullable()->after('is_edited');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pulse')->dropIfExists('message_edits');
        
        Schema::connection('pulse')->table('messages', function (Blueprint $table) {
            $table->dropColumn('edited_at');
        });
    }
};
