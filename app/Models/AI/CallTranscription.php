<?php

namespace App\Models\AI;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CallTranscription extends Model
{
    protected $connection = 'ai';
    protected $table = 'ai_call_transcriptions';

    protected $fillable = [
        'ai_call_recording_id',
        'full_transcript',
        'language_detected',
        'confidence_score',
        'model_used',
        'processing_time_seconds',
    ];

    protected $casts = [
        'confidence_score' => 'float',
        'processing_time_seconds' => 'integer',
    ];

    /**
     * Get the recording this transcription belongs to
     */
    public function recording(): BelongsTo
    {
        return $this->belongsTo(CallRecording::class, 'ai_call_recording_id');
    }

    /**
     * Get all segments for this transcription
     */
    public function segments(): HasMany
    {
        return $this->hasMany(CallSegment::class, 'ai_call_transcription_id')->orderBy('start_time');
    }

    /**
     * Get segments by speaker
     */
    public function segmentsBySpeaker(string $speaker): HasMany
    {
        return $this->segments()->where('speaker_label', $speaker);
    }

    /**
     * Get unique speakers
     */
    public function getSpeakersAttribute(): array
    {
        return $this->segments()
            ->distinct('speaker_label')
            ->pluck('speaker_label')
            ->toArray();
    }
}
