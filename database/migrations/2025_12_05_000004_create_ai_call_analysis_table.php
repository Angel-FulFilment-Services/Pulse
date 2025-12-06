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
        Schema::connection('ai')->create('ai_call_analysis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_call_recording_id')->constrained('ai_call_recordings')->onDelete('cascade');
            $table->text('summary')->nullable()->comment('AI-generated call summary');
            $table->decimal('sentiment_score', 4, 2)->nullable()->comment('Scale: -10 to +10');
            $table->enum('sentiment_label', ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'])->nullable();
            $table->json('key_topics')->nullable()->comment('Array of identified topics/keywords');
            $table->json('action_items')->nullable()->comment('Extracted action items or follow-ups');
            $table->decimal('quality_score', 5, 2)->nullable()->comment('Call quality score 0-100');
            $table->json('compliance_flags')->nullable()->comment('Compliance issues detected');
            $table->json('speaker_metrics')->nullable()->comment('Talk time, interruptions, etc per speaker');
            $table->string('model_used')->default('llama-3.1-8b')->comment('LLM model version');
            $table->integer('processing_time_seconds')->nullable();
            $table->timestamps();

            $table->index('ai_call_recording_id');
            $table->index('sentiment_label');
            $table->index('quality_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('ai')->dropIfExists('ai_call_analysis');
    }
};
