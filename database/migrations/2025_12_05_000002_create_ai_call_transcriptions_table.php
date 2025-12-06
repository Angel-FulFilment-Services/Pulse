<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'ai';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('ai')->create('ai_call_transcriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_call_recording_id')->constrained('ai_call_recordings')->onDelete('cascade');
            $table->longText('full_transcript');
            $table->json('segments')->nullable()->comment('Word-level segments with timestamps and speaker info');
            $table->longText('redacted_transcript')->nullable()->comment('PII-redacted version');
            $table->json('pii_detected')->nullable()->comment('PII entities found and redacted');
            $table->string('language_detected')->nullable();
            $table->decimal('confidence_score', 5, 4)->nullable()->comment('0-1 confidence score');
            $table->string('model_used')->default('whisper-medium')->comment('WhisperX model version');
            $table->integer('processing_time_seconds')->nullable();
            $table->timestamps();

            $table->index('ai_call_recording_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('ai')->dropIfExists('ai_call_transcriptions');
    }
};
