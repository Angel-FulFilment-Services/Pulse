<?php

namespace App\Models\Badge;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Badge extends Model
{
    protected $connection = 'pulse';

    protected $fillable = [
        'slug',
        'name',
        'description',
        'icon',
        'image_url',
        'category',
        'tier',
        'color',
        'criteria_query',
        'threshold',
        'points',
        'sort_order',
        'is_active',
        'is_secret',
        'prerequisite_badge_id',
        'expires_after_days',
        'max_awards',
        'display_condition',
        'repeatable',
    ];

    protected $casts = [
        'criteria_query' => 'array',
        'display_condition' => 'array',
        'is_active' => 'boolean',
        'is_secret' => 'boolean',
        'repeatable' => 'boolean',
        'threshold' => 'integer',
        'points' => 'integer',
        'sort_order' => 'integer',
        'expires_after_days' => 'integer',
        'max_awards' => 'integer',
    ];

    /**
     * Get the prerequisite badge
     */
    public function prerequisiteBadge(): BelongsTo
    {
        return $this->belongsTo(Badge::class, 'prerequisite_badge_id');
    }

    /**
     * Get badges that require this badge as a prerequisite
     */
    public function dependentBadges(): HasMany
    {
        return $this->hasMany(Badge::class, 'prerequisite_badge_id');
    }

    /**
     * Get all user awards for this badge
     */
    public function userBadges(): HasMany
    {
        return $this->hasMany(UserBadge::class);
    }

    /**
     * Get all user progress for this badge
     */
    public function userProgress(): HasMany
    {
        return $this->hasMany(UserBadgeProgress::class);
    }

    /**
     * Get badge history entries
     */
    public function history(): HasMany
    {
        return $this->hasMany(BadgeHistory::class);
    }

    /**
     * Scope to only active badges
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to only visible badges (not secret)
     */
    public function scopeVisible($query)
    {
        return $query->where('is_secret', false);
    }

    /**
     * Scope by category
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope by tier
     */
    public function scopeTier($query, $tier)
    {
        return $query->where('tier', $tier);
    }
}
