<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $connection = 'pulse';
    
    protected $fillable = [
        'message',
        'created_by',
        'scope',
        'team_id',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The user who created the announcement
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User\User::class, 'created_by');
    }

    /**
     * Alias for creator relationship (for convenience)
     */
    public function user(): BelongsTo
    {
        return $this->creator();
    }

    /**
     * The team this announcement belongs to (for team-scoped announcements)
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Scope to get active (non-expired) announcements
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    /**
     * Scope to get global announcements
     */
    public function scopeGlobal($query)
    {
        return $query->where('scope', 'global');
    }

    /**
     * Scope to get team-specific announcements
     */
    public function scopeForTeam($query, $teamId)
    {
        return $query->where('scope', 'team')->where('team_id', $teamId);
    }

    /**
     * Check if the announcement is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if the announcement is active
     */
    public function isActive(): bool
    {
        return !$this->isExpired();
    }
}
