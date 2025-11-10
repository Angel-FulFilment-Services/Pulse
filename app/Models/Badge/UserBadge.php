<?php

namespace App\Models\Badge;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User\User;

class UserBadge extends Model
{
    protected $connection = 'pulse';

    protected $fillable = [
        'user_id',
        'badge_id',
        'awarded_at',
        'progress_value',
        'notification_sent_at',
        'viewed_at',
        'rank',
        'expires_at',
        'revoked_at',
        'award_reason',
    ];

    protected $casts = [
        'awarded_at' => 'datetime',
        'notification_sent_at' => 'datetime',
        'viewed_at' => 'datetime',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
        'progress_value' => 'integer',
        'rank' => 'integer',
    ];

    /**
     * Get the badge
     */
    public function badge(): BelongsTo
    {
        return $this->belongsTo(Badge::class);
    }

    /**
     * Get the user (from main database)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to only active (not revoked) badges
     */
    public function scopeActive($query)
    {
        return $query->whereNull('revoked_at');
    }

    /**
     * Scope to only revoked badges
     */
    public function scopeRevoked($query)
    {
        return $query->whereNotNull('revoked_at');
    }

    /**
     * Scope to unviewed badges
     */
    public function scopeUnviewed($query)
    {
        return $query->whereNull('viewed_at');
    }

    /**
     * Scope to badges that haven't sent notifications yet
     */
    public function scopePendingNotification($query)
    {
        return $query->whereNull('notification_sent_at');
    }

    /**
     * Check if badge is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if badge is new (not viewed yet)
     */
    public function isNew(): bool
    {
        return $this->viewed_at === null;
    }

    /**
     * Mark badge as viewed
     */
    public function markAsViewed(): void
    {
        if ($this->viewed_at === null) {
            $this->update(['viewed_at' => now()]);
        }
    }
}
