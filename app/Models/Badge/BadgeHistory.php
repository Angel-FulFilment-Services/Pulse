<?php

namespace App\Models\Badge;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User\User;

class BadgeHistory extends Model
{
    protected $connection = 'pulse';
    protected $table = 'badge_history';
    public $timestamps = false;

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'badge_id',
        'event_type',
        'old_value',
        'new_value',
        'metadata',
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    // Event types
    const EVENT_AWARDED = 'awarded';
    const EVENT_REVOKED = 'revoked';
    const EVENT_PROGRESS_UPDATED = 'progress_updated';
    const EVENT_TIER_CHANGED = 'tier_changed';
    const EVENT_MILESTONE_HIT = 'milestone_hit';

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
     * Log a badge award
     */
    public static function logAward(int $userId, int $badgeId, array $metadata = []): void
    {
        static::create([
            'user_id' => $userId,
            'badge_id' => $badgeId,
            'event_type' => static::EVENT_AWARDED,
            'new_value' => ['awarded_at' => now()],
            'metadata' => $metadata,
        ]);
    }

    /**
     * Log a badge revocation
     */
    public static function logRevoke(int $userId, int $badgeId, string $reason = null): void
    {
        static::create([
            'user_id' => $userId,
            'badge_id' => $badgeId,
            'event_type' => static::EVENT_REVOKED,
            'new_value' => ['revoked_at' => now()],
            'metadata' => $reason ? ['reason' => $reason] : null,
        ]);
    }

    /**
     * Log progress update
     */
    public static function logProgress(int $userId, int $badgeId, int $oldCount, int $newCount): void
    {
        static::create([
            'user_id' => $userId,
            'badge_id' => $badgeId,
            'event_type' => static::EVENT_PROGRESS_UPDATED,
            'old_value' => ['count' => $oldCount],
            'new_value' => ['count' => $newCount],
        ]);
    }

    /**
     * Log tier change
     */
    public static function logTierChange(int $userId, int $oldTierId = null, int $newTierId = null): void
    {
        static::create([
            'user_id' => $userId,
            'event_type' => static::EVENT_TIER_CHANGED,
            'old_value' => $oldTierId ? ['tier_id' => $oldTierId] : null,
            'new_value' => $newTierId ? ['tier_id' => $newTierId] : null,
        ]);
    }
}
