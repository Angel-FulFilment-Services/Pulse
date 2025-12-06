<?php

namespace App\Models\AI;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CallRecording extends Model
{
    use SoftDeletes;

    protected $connection = 'ai';
    protected $table = 'ai_call_recordings';

    protected $fillable = [
        'apex_id',
        'r2_path',
        'r2_bucket',
        'duration_seconds',
        'file_size_bytes',
        'file_format',
        'processing_status',
        'processing_error',
        'uploaded_at',
        'processing_started_at',
        'processing_completed_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
        'processing_started_at' => 'datetime',
        'processing_completed_at' => 'datetime',
    ];

    /**
     * Get the transcription for this recording
     */
    public function transcription(): HasOne
    {
        return $this->hasOne(CallTranscription::class, 'ai_call_recording_id');
    }

    /**
     * Get the analysis for this recording
     */
    public function analysis(): HasOne
    {
        return $this->hasOne(CallAnalysis::class, 'ai_call_recording_id');
    }

    /**
     * Mark recording as processing
     */
    public function markAsProcessing(): void
    {
        $this->update([
            'processing_status' => 'processing',
            'processing_started_at' => now(),
        ]);
    }

    /**
     * Mark recording as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'processing_status' => 'completed',
            'processing_completed_at' => now(),
        ]);
    }

    /**
     * Mark recording as failed
     */
    public function markAsFailed(string $error): void
    {
        $this->update([
            'processing_status' => 'failed',
            'processing_error' => $error,
            'processing_completed_at' => now(),
        ]);
    }

    /**
     * Get R2 full URL
     */
    public function getR2UrlAttribute(): string
    {
        return \Storage::disk('r2')->url($this->r2_path);
    }

    /**
     * Scope for pending recordings
     */
    public function scopePending($query)
    {
        return $query->where('processing_status', 'pending');
    }

    /**
     * Scope for failed recordings
     */
    public function scopeFailed($query)
    {
        return $query->where('processing_status', 'failed');
    }
}
