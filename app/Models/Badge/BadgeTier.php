<?php

namespace App\Models\Badge;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BadgeTier extends Model
{
    protected $connection = 'pulse';

    protected $fillable = [
        'name',
        'slug',
        'min_points',
        'color',
        'icon',
        'sort_order',
    ];

    protected $casts = [
        'min_points' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * Get users currently at this tier
     */
    public function currentUsers(): HasMany
    {
        return $this->hasMany(UserBadgeStats::class, 'current_tier_id');
    }

    /**
     * Get users who have reached this tier (peak)
     */
    public function peakUsers(): HasMany
    {
        return $this->hasMany(UserBadgeStats::class, 'highest_tier_reached_id');
    }

    /**
     * Scope ordered by sort order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Get the next tier up
     */
    public function nextTier()
    {
        return static::where('min_points', '>', $this->min_points)
            ->orderBy('min_points')
            ->first();
    }

    /**
     * Get the previous tier down
     */
    public function previousTier()
    {
        return static::where('min_points', '<', $this->min_points)
            ->orderBy('min_points', 'desc')
            ->first();
    }
}
