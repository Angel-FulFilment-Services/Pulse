<?php

namespace App\Models\Badge;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User\User;

class UserBadgeStats extends Model
{
    protected $connection = 'pulse';
    protected $primaryKey = 'user_id';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'total_badges',
        'total_points',
        'current_tier_id',
        'highest_tier_reached_id',
        'badges_refreshed_at',
        'last_badge_earned_at',
    ];

    protected $casts = [
        'total_badges' => 'integer',
        'total_points' => 'integer',
        'badges_refreshed_at' => 'datetime',
        'last_badge_earned_at' => 'datetime',
    ];

    /**
     * Get the user (from main database)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the current tier
     */
    public function currentTier(): BelongsTo
    {
        return $this->belongsTo(BadgeTier::class, 'current_tier_id');
    }

    /**
     * Get the highest tier reached
     */
    public function highestTierReached(): BelongsTo
    {
        return $this->belongsTo(BadgeTier::class, 'highest_tier_reached_id');
    }

    /**
     * Update tier based on total points
     */
    public function updateTier(): void
    {
        $tier = BadgeTier::where('min_points', '<=', $this->total_points)
            ->orderBy('min_points', 'desc')
            ->first();

        if ($tier) {
            $this->current_tier_id = $tier->id;
            
            // Update highest tier if this is higher
            if (!$this->highest_tier_reached_id || 
                $tier->min_points > ($this->highestTierReached->min_points ?? 0)) {
                $this->highest_tier_reached_id = $tier->id;
            }
            
            $this->save();
        }
    }

    /**
     * Increment badge count and points
     */
    public function incrementBadge(int $points): void
    {
        $this->total_badges++;
        $this->total_points += $points;
        $this->last_badge_earned_at = now();
        $this->save();
        
        $this->updateTier();
    }
}
