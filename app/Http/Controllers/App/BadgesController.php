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

        // Get all active badges with their tier information
        $badges = Badge::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('tier')
            ->get()
            ->map(function ($badge) use ($userId) {
                // Get user's earned badge if exists
                $userBadge = UserBadge::where('user_id', $userId)
                    ->where('badge_id', $badge->id)
                    ->active()
                    ->first();

                // Get user's progress if not earned
                $progress = null;
                if (!$userBadge) {
                    $badgeProgress = UserBadgeProgress::where('user_id', $userId)
                        ->where('badge_id', $badge->id)
                        ->first();

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
                    $prereq = Badge::find($badge->prerequisite_badge_id);
                    if ($prereq) {
                        // Check if user has earned the prerequisite
                        $prereqEarned = UserBadge::where('user_id', $userId)
                            ->where('badge_id', $prereq->id)
                            ->active()
                            ->exists();

                        $prerequisiteBadge = [
                            'id' => $prereq->id,
                            'name' => $prereq->name,
                            'is_earned' => $prereqEarned,
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
                    'awards_count' => $badge->repeatable ? UserBadge::where('user_id', $userId)
                        ->where('badge_id', $badge->id)
                        ->active()
                        ->count() : null,
                    'progress' => $progress,
                    'prerequisite_badge' => $prerequisiteBadge,
                    'tier_info' => $tierInfo,
                ];
            });

        return response()->json($badges);
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
