<?php

namespace App\Models\Badge;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User\User;

class UserBadgeProgress extends Model
{
    protected $connection = 'pulse';
    protected $table = 'user_badge_progress';
    protected $primaryKey = null;
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'badge_id',
        'current_count',
        'percentage',
        'started_at',
        'last_checked_at',
        'milestone_hit',
    ];

    protected $casts = [
        'current_count' => 'integer',
        'percentage' => 'decimal:2',
        'started_at' => 'datetime',
        'last_checked_at' => 'datetime',
        'milestone_hit' => 'array',
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
     * Calculate and update percentage based on badge threshold
     */
    public function updatePercentage(): void
    {
        if ($this->badge && $this->badge->threshold > 0) {
            $this->percentage = min(100, ($this->current_count / $this->badge->threshold) * 100);
            $this->save();
        }
    }

    /**
     * Check if badge is complete
     */
    public function isComplete(): bool
    {
        return $this->percentage >= 100;
    }

    /**
     * Add a milestone if not already hit
     */
    public function addMilestone(int $milestone): void
    {
        $milestones = $this->milestone_hit ?? [];
        
        if (!in_array($milestone, $milestones)) {
            $milestones[] = $milestone;
            sort($milestones);
            $this->milestone_hit = $milestones;
            $this->save();
        }
    }
}
