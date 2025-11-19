<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Badge\Badge;
use App\Models\Badge\UserBadge;
use App\Models\Badge\UserBadgeProgress;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BadgesController extends Controller
{
    /**
     * Get all badges for the authenticated user with their progress and earned status
     */
    public function index(Request $request)
    {
        $userId = Auth::id();

        // Eager load all related data in bulk to avoid N+1 queries
        $badges = Badge::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('tier')
            ->get();

        // Bulk fetch all user badges for this user
        $userBadges = UserBadge::where('user_id', $userId)
            ->whereIn('badge_id', $badges->pluck('id'))
            ->active()
            ->get()
            ->keyBy('badge_id');

        // Bulk fetch all user badge progress for this user
        $userProgress = UserBadgeProgress::where('user_id', $userId)
            ->whereIn('badge_id', $badges->pluck('id'))
            ->get()
            ->keyBy('badge_id');

        // Get all prerequisite badge IDs
        $prereqBadgeIds = $badges->whereNotNull('prerequisite_badge_id')->pluck('prerequisite_badge_id')->unique();
        
        // Bulk fetch prerequisite badges
        $prereqBadges = Badge::whereIn('id', $prereqBadgeIds)->get()->keyBy('id');
        
        // Bulk fetch prerequisite earned status
        $prereqEarned = UserBadge::where('user_id', $userId)
            ->whereIn('badge_id', $prereqBadgeIds)
            ->active()
            ->pluck('badge_id')
            ->flip();

        // Bulk count awards for repeatable badges
        $repeatableBadgeIds = $badges->where('repeatable', true)->pluck('id');
        $awardsCounts = UserBadge::where('user_id', $userId)
            ->whereIn('badge_id', $repeatableBadgeIds)
            ->active()
            ->select('badge_id', DB::raw('count(*) as count'))
            ->groupBy('badge_id')
            ->pluck('count', 'badge_id');

        // Map badges with all pre-fetched data
        $result = $badges->map(function ($badge) use ($userId, $userBadges, $userProgress, $prereqBadges, $prereqEarned, $awardsCounts) {
            // Get user's earned badge if exists
            $userBadge = $userBadges->get($badge->id);

            // Get user's progress if not earned
            $progress = null;
            if (!$userBadge) {
                $badgeProgress = $userProgress->get($badge->id);
                if ($badgeProgress) {
                    $progress = [
                        'current_count' => $badgeProgress->current_count,
                        'threshold' => $badge->threshold,
                        'percentage' => (float) $badgeProgress->percentage,
                        'started_at' => $badgeProgress->started_at,
                        'last_checked_at' => $badgeProgress->last_checked_at,
                        'milestone_hit' => $badgeProgress->milestone_hit,
                    ];
                }
            }

            // Get prerequisite badge info if exists
            $prerequisiteBadge = null;
            if ($badge->prerequisite_badge_id) {
                $prereq = $prereqBadges->get($badge->prerequisite_badge_id);
                if ($prereq) {
                    $prerequisiteBadge = [
                        'id' => $prereq->id,
                        'name' => $prereq->name,
                        'is_earned' => $prereqEarned->has($prereq->id),
                    ];
                }
            }

            // Build tier info
            $tierInfo = [
                'name' => ucfirst($badge->tier),
                'color' => $badge->color,
            ];

            return [
                'id' => $badge->id,
                'name' => $badge->name,
                'description' => $badge->description,
                'icon' => $badge->icon ?? 'TrophyIcon',
                'image_url' => $badge->image_url,
                'category' => $badge->category,
                'tier' => $badge->tier,
                'threshold' => $badge->threshold,
                'points' => $badge->points,
                'is_secret' => $badge->is_secret,
                'repeatable' => $badge->repeatable,
                'max_awards' => $badge->max_awards,
                'is_earned' => $userBadge !== null,
                'awarded_at' => $userBadge?->awarded_at,
                'viewed_at' => $userBadge?->viewed_at,
                'isNew' => $userBadge && $userBadge->viewed_at === null,
                'progress_value' => $userBadge?->progress_value,
                'rank' => $userBadge?->rank,
                'awards_count' => $badge->repeatable ? ($awardsCounts->get($badge->id) ?? 0) : null,
                'progress' => $progress,
                'prerequisite_badge' => $prerequisiteBadge,
                'tier_info' => $tierInfo,
            ];
        });

        return response()->json($result);
    }

    /**
     * Mark badge as viewed (remove "NEW" indicator)
     */
    public function markAsViewed(Request $request, $badgeId)
    {
        $userId = Auth::id();

        $userBadge = UserBadge::where('user_id', $userId)
            ->where('badge_id', $badgeId)
            ->active()
            ->first();

        if ($userBadge && $userBadge->viewed_at === null) {
            $userBadge->viewed_at = now();
            $userBadge->save();

            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'message' => 'Badge not found or already viewed'], 404);
    }

    /**
     * Get badge statistics for the authenticated user
     */
    public function statistics(Request $request)
    {
        $userId = Auth::id();

        $totalBadges = Badge::where('is_active', true)->count();
        $earnedBadges = UserBadge::where('user_id', $userId)->active()->count();
        $totalPoints = UserBadge::where('user_id', $userId)
            ->active()
            ->join('badges', 'user_badges.badge_id', '=', 'badges.id')
            ->sum('badges.points');

        $inProgress = UserBadgeProgress::where('user_id', $userId)
            ->where('percentage', '>', 0)
            ->where('percentage', '<', 100)
            ->count();

        $locked = Badge::where('is_active', true)
            ->whereNotNull('prerequisite_badge_id')
            ->whereNotIn('id', function ($query) use ($userId) {
                $query->select('badge_id')
                    ->from('user_badges')
                    ->where('user_id', $userId)
                    ->whereNull('revoked_at');
            })
            ->count();

        return response()->json([
            'total_badges' => $totalBadges,
            'earned_badges' => $earnedBadges,
            'total_points' => $totalPoints,
            'in_progress' => $inProgress,
            'locked' => $locked,
            'completion_percentage' => $totalBadges > 0 ? round(($earnedBadges / $totalBadges) * 100, 2) : 0,
        ]);
    }
}
