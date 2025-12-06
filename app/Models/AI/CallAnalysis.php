<?php

namespace App\Models\AI;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallAnalysis extends Model
{
    protected $connection = 'ai';
    protected $table = 'ai_call_analysis';

    protected $fillable = [
        'ai_call_recording_id',
        'summary',
        'sentiment_score',
        'sentiment_label',
        'key_topics',
        'action_items',
        'quality_score',
        'compliance_flags',
        'speaker_metrics',
        'model_used',
        'processing_time_seconds',
    ];

    protected $casts = [
        'sentiment_score' => 'float',
        'quality_score' => 'float',
        'key_topics' => 'array',
        'action_items' => 'array',
        'compliance_flags' => 'array',
        'speaker_metrics' => 'array',
        'processing_time_seconds' => 'integer',
    ];

    /**
     * Get the recording this analysis belongs to
     */
    public function recording(): BelongsTo
    {
        return $this->belongsTo(CallRecording::class, 'ai_call_recording_id');
    }

    /**
     * Get sentiment color for UI
     */
    public function getSentimentColorAttribute(): string
    {
        return match($this->sentiment_label) {
            'very_positive' => 'green',
            'positive' => 'lime',
            'neutral' => 'gray',
            'negative' => 'orange',
            'very_negative' => 'red',
            default => 'gray',
        };
    }

    /**
     * Get quality grade (A-F)
     */
    public function getQualityGradeAttribute(): string
    {
        if ($this->quality_score === null) return 'N/A';
        
        return match(true) {
            $this->quality_score >= 90 => 'A',
            $this->quality_score >= 80 => 'B',
            $this->quality_score >= 70 => 'C',
            $this->quality_score >= 60 => 'D',
            default => 'F',
        };
    }

    /**
     * Check if call has compliance issues
     */
    public function hasComplianceIssues(): bool
    {
        return !empty($this->compliance_flags);
    }
}
