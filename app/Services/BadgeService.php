<?php

namespace App\Services;

use App\Models\Badge\Badge;
use App\Models\Badge\UserBadge;
use App\Models\Badge\UserBadgeProgress;
use App\Models\Badge\UserBadgeStats;
use App\Models\Badge\BadgeHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BadgeService
{
    /**
     * Check and update all badges for a specific user
     */
    public function refreshUserBadges(int $userId): array
    {
        $results = [
            'checked' => 0,
            'awarded' => [],
            'progress_updated' => [],
            'errors' => [],
        ];

        // Get all active badges
        $badges = Badge::active()->get();

        foreach ($badges as $badge) {
            try {
                $results['checked']++;
                $result = $this->checkBadgeForUser($userId, $badge);
                
                if ($result['awarded']) {
                    $results['awarded'][] = $badge->slug;
                }
                
                if ($result['progress_updated']) {
                    $results['progress_updated'][] = $badge->slug;
                }
            } catch (\Exception $e) {
                Log::error("Badge check failed for user {$userId}, badge {$badge->slug}: " . $e->getMessage());
                $results['errors'][] = [
                    'badge' => $badge->slug,
                    'error' => $e->getMessage(),
                ];
            }
        }

        // Update user stats refresh timestamp
        $this->updateUserStats($userId);

        return $results;
    }

    /**
     * Check a specific badge for a user
     */
    public function checkBadgeForUser(int $userId, Badge $badge): array
    {
        $result = [
            'awarded' => false,
            'progress_updated' => false,
        ];

        // Check if user already has this badge (and it's not repeatable)
        if (!$badge->repeatable) {
            $existingAward = UserBadge::where('user_id', $userId)
                ->where('badge_id', $badge->id)
                ->whereNull('revoked_at')
                ->exists();
                
            if ($existingAward) {
                return $result;
            }
        }

        // Check prerequisites and inherit progress if applicable
        $prerequisiteProgress = null;
        $shouldInheritProgress = false;
        if ($badge->prerequisite_badge_id) {
            $prerequisiteBadge = UserBadge::where('user_id', $userId)
                ->where('badge_id', $badge->prerequisite_badge_id)
                ->whereNull('revoked_at')
                ->first();
                
            if (!$prerequisiteBadge) {
                return $result; // Prerequisite not met
            }

            // Get the prerequisite badge's full details to compare
            $prerequisiteBadgeModel = Badge::find($badge->prerequisite_badge_id);
            
            // Only inherit progress if badges share the same category and similar criteria structure
            // This allows tiered badges to inherit, but prevents unrelated prerequisites from inheriting
            if ($prerequisiteBadgeModel && $this->shouldInheritProgress($badge, $prerequisiteBadgeModel)) {
                $shouldInheritProgress = true;
                $prerequisiteProgress = UserBadgeProgress::where('user_id', $userId)
                    ->where('badge_id', $badge->prerequisite_badge_id)
                    ->first();
            }
        }

        // Get or create progress record
        $progress = UserBadgeProgress::firstOrNew([
            'user_id' => $userId,
            'badge_id' => $badge->id,
        ]);

        // Initialize progress from prerequisite if this is the first check and inheritance is allowed
        if (!$progress->exists && $shouldInheritProgress && $prerequisiteProgress) {
            $progress->current_count = $prerequisiteProgress->current_count ?? 0;
            $progress->last_checked_at = $prerequisiteProgress->last_checked_at;
            $progress->started_at = $prerequisiteProgress->started_at;
        }

        $oldCount = $progress->current_count ?? 0;
        $lastChecked = $progress->last_checked_at;

        // Calculate current count based on criteria
        $newCount = $this->calculateBadgeProgress($userId, $badge, $lastChecked);

        // Add the inherited count to the new incremental count (only if we inherited)
        if ($shouldInheritProgress && $prerequisiteProgress && $lastChecked) {
            $newCount += $oldCount;
        }

        // Update progress
        if ($newCount !== $oldCount) {
            $progress->current_count = $newCount;
            $progress->last_checked_at = now();
            
            if (!$progress->started_at) {
                $progress->started_at = now();
            }
            
            $progress->updatePercentage();
            $progress->save();
            
            $result['progress_updated'] = true;
            
            // Log progress update
            if ($oldCount > 0) {
                BadgeHistory::logProgress($userId, $badge->id, $oldCount, $newCount);
            }
        } else {
            // Still update last_checked_at even if no change
            $progress->last_checked_at = now();
            $progress->save();
        }

        // Award badge if threshold met
        if ($newCount >= $badge->threshold) {
            $awarded = $this->awardBadge($userId, $badge, $newCount);
            if ($awarded) {
                $result['awarded'] = true;
            }
        }

        return $result;
    }

    /**
     * Calculate progress for a badge based on its criteria
     */
    protected function calculateBadgeProgress(int $userId, Badge $badge, ?Carbon $lastChecked): int
    {
        $criteria = $badge->criteria_query;
        
        if (!$criteria || !isset($criteria['table'])) {
            return 0;
        }

        // Resolve the correct user identifier for the CRM
        $crmUserId = $this->resolveCrmUserId($userId, $criteria);
        
        if (!$crmUserId) {
            return 0; // User doesn't have mapping for this CRM
        }

        // Handle special calculation types (like years_since)
        if (isset($criteria['calculation_type'])) {
            return $this->calculateSpecialType($crmUserId, $criteria);
        }

        // Standard count/sum logic
        if (!isset($criteria['count_column'])) {
            return 0;
        }

        // Build base query
        $query = DB::connection($criteria['connection'] ?? 'mysql')
            ->table($criteria['table']);

        // Add user filter
        $userColumn = $criteria['user_column'] ?? 'user_id';
        $query->where($userColumn, $crmUserId);

        // Add date filter for incremental checks (if we have a last_checked timestamp)
        if ($lastChecked && isset($criteria['date_column'])) {
            $query->where($criteria['date_column'], '>', $lastChecked);
        }

        // Add any additional where conditions
        if (isset($criteria['where'])) {
            foreach ($criteria['where'] as $column => $value) {
                if (is_array($value)) {
                    $query->whereIn($column, $value);
                } else {
                    $query->where($column, $value);
                }
            }
        }

        // Add any whereNotIn conditions
        if (isset($criteria['where_not_in'])) {
            foreach ($criteria['where_not_in'] as $column => $values) {
                $query->whereNotIn($column, $values);
            }
        }

        // Count or sum based on configuration
        if ($criteria['count_column'] === '*') {
            return $query->count();
        } else {
            return (int) $query->sum($criteria['count_column']);
        }
    }

    /**
     * Calculate special badge types (years_since, etc.)
     */
    protected function calculateSpecialType(int $crmUserId, array $criteria): int
    {
        switch ($criteria['calculation_type']) {
            case 'years_since':
                // Calculate years between a date field and now
                if (!isset($criteria['date_field'])) {
                    return 0;
                }

                $record = DB::connection($criteria['connection'] ?? 'mysql')
                    ->table($criteria['table'])
                    ->where($criteria['user_column'] ?? 'user_id', $crmUserId)
                    ->first([$criteria['date_field']]);

                if (!$record || !$record->{$criteria['date_field']}) {
                    return 0;
                }

                $startDate = Carbon::parse($record->{$criteria['date_field']});
                return (int) $startDate->diffInYears(now());

            default:
                return 0;
        }
    }

    /**
     * Determine if progress should be inherited from prerequisite badge
     * Only inherit if badges are part of the same progression (same category and similar criteria)
     */
    protected function shouldInheritProgress(Badge $currentBadge, Badge $prerequisiteBadge): bool
    {
        // Must be same category (e.g., both "diallings" badges)
        if ($currentBadge->category !== $prerequisiteBadge->category) {
            return false;
        }

        // Compare criteria structure to ensure they're measuring the same thing
        $currentCriteria = $currentBadge->criteria_query;
        $prerequisiteCriteria = $prerequisiteBadge->criteria_query;

        if (!$currentCriteria || !$prerequisiteCriteria) {
            return false;
        }

        // Check if they use the same data source (connection + table)
        $sameConnection = ($currentCriteria['connection'] ?? 'mysql') === ($prerequisiteCriteria['connection'] ?? 'mysql');
        $sameTable = ($currentCriteria['table'] ?? '') === ($prerequisiteCriteria['table'] ?? '');
        $sameCountColumn = ($currentCriteria['count_column'] ?? '') === ($prerequisiteCriteria['count_column'] ?? '');
        
        // For special calculation types, check if they're the same type
        $currentCalcType = $currentCriteria['calculation_type'] ?? null;
        $prereqCalcType = $prerequisiteCriteria['calculation_type'] ?? null;
        
        if ($currentCalcType || $prereqCalcType) {
            // Both must have the same calculation type
            return $currentCalcType === $prereqCalcType;
        }

        // For standard counting/summing, must use same data source
        return $sameConnection && $sameTable && $sameCountColumn;
    }

    /**
     * Resolve the CRM user ID based on the mapping configuration
     */
    protected function resolveCrmUserId(int $userId, array $criteria): ?int
    {
        // If no mapping specified, assume direct user_id
        if (!isset($criteria['user_id_mapping'])) {
            return $userId;
        }

        $mapping = $criteria['user_id_mapping'];

        // Handle different mapping types
        switch ($mapping['type'] ?? 'direct') {
            case 'halo_id':
                // Get halo_id from users table
                $user = DB::table('users')->where('id', $userId)->first(['halo_id']);
                return $user->halo_id ?? null;

            case 'hr_id':
                // Get hr_id from wings_data.hr_details table via Employee model
                $hrDetails = DB::connection('wings_data')
                    ->table('hr_details')
                    ->where('user_id', $userId)
                    ->first(['hr_id']);
                return $hrDetails->hr_id ?? null;

            case 'custom':
                // Custom mapping with specific connection/table/column
                $result = DB::connection($mapping['connection'] ?? 'mysql')
                    ->table($mapping['table'])
                    ->where($mapping['lookup_column'], $userId)
                    ->first([$mapping['return_column']]);
                return $result->{$mapping['return_column']} ?? null;

            case 'direct':
            default:
                return $userId;
        }
    }

    /**
     * Award a badge to a user
     */
    public function awardBadge(int $userId, Badge $badge, int $progressValue): bool
    {
        // Check max awards limit
        if ($badge->max_awards) {
            $totalAwarded = UserBadge::where('badge_id', $badge->id)
                ->whereNull('revoked_at')
                ->count();
                
            if ($totalAwarded >= $badge->max_awards) {
                return false;
            }
        }

        // Check if already awarded (for non-repeatable badges)
        if (!$badge->repeatable) {
            $exists = UserBadge::where('user_id', $userId)
                ->where('badge_id', $badge->id)
                ->whereNull('revoked_at')
                ->exists();
                
            if ($exists) {
                return false;
            }
        }

        // Calculate rank if needed (position in leaderboard)
        $rank = null;
        if ($badge->category) {
            $rank = UserBadge::where('badge_id', $badge->id)
                ->whereNull('revoked_at')
                ->count() + 1;
        }

        // Calculate expiration date if applicable
        $expiresAt = null;
        if ($badge->expires_after_days) {
            $expiresAt = now()->addDays($badge->expires_after_days);
        }

        // Create the award
        $userBadge = UserBadge::create([
            'user_id' => $userId,
            'badge_id' => $badge->id,
            'awarded_at' => now(),
            'progress_value' => $progressValue,
            'rank' => $rank,
            'expires_at' => $expiresAt,
        ]);

        // Update user stats
        $stats = UserBadgeStats::firstOrCreate(
            ['user_id' => $userId],
            [
                'total_badges' => 0,
                'total_points' => 0,
            ]
        );
        
        $stats->incrementBadge($badge->points);

        // Log the award
        BadgeHistory::logAward($userId, $badge->id, [
            'progress_value' => $progressValue,
            'rank' => $rank,
            'points' => $badge->points,
        ]);

        Log::info("Badge awarded", [
            'user_id' => $userId,
            'badge' => $badge->slug,
            'points' => $badge->points,
            'rank' => $rank,
        ]);

        return true;
    }

    /**
     * Revoke a badge from a user
     */
    public function revokeBadge(int $userId, int $badgeId, string $reason = null): bool
    {
        $userBadge = UserBadge::where('user_id', $userId)
            ->where('badge_id', $badgeId)
            ->whereNull('revoked_at')
            ->first();

        if (!$userBadge) {
            return false;
        }

        $userBadge->update(['revoked_at' => now()]);

        // Update user stats
        $stats = UserBadgeStats::where('user_id', $userId)->first();
        if ($stats && $userBadge->badge) {
            $stats->total_badges--;
            $stats->total_points -= $userBadge->badge->points;
            $stats->save();
            $stats->updateTier();
        }

        // Log the revocation
        BadgeHistory::logRevoke($userId, $badgeId, $reason);

        return true;
    }

    /**
     * Update user badge stats refresh timestamp
     */
    protected function updateUserStats(int $userId): void
    {
        $stats = UserBadgeStats::firstOrCreate(
            ['user_id' => $userId],
            [
                'total_badges' => 0,
                'total_points' => 0,
            ]
        );

        $stats->badges_refreshed_at = now();
        $stats->save();
    }

    /**
     * Get user's badge summary
     */
    public function getUserBadgeSummary(int $userId): array
    {
        $stats = UserBadgeStats::with(['currentTier', 'highestTierReached'])
            ->where('user_id', $userId)
            ->first();

        $badges = UserBadge::with('badge')
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->orderBy('awarded_at', 'desc')
            ->get();

        $progress = UserBadgeProgress::with('badge')
            ->where('user_id', $userId)
            ->where('percentage', '>', 0)
            ->where('percentage', '<', 100)
            ->orderBy('percentage', 'desc')
            ->get();

        return [
            'stats' => $stats,
            'badges' => $badges,
            'in_progress' => $progress,
            'new_badges_count' => UserBadge::where('user_id', $userId)
                ->whereNull('viewed_at')
                ->whereNull('revoked_at')
                ->count(),
        ];
    }
}
