<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\HR\Employee;
use App\Models\Chat\Announcement;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    // Block logged out users from using dashboard
    public function __construct(){
        $this->middleware(['auth', 'twofactor']);
        $this->middleware(['log.access']);
    }

    public function index(){
        return Inertia::render('Dashboard/Dashboard');
    }

    public function wallboard(){
        return Inertia::render('Dashboard/Wallboard');
    }

    /**
     * Get managers currently on duty (rank DM or TM)
     * Returns managers who are clocked in today
     */
    public function managersOnDuty(Request $request)
    {
        $today = Carbon::today()->format('Y-m-d');
        
        // Get managers (DM or TM rank) with their timesheet status for today
        $managers = Employee::leftJoin('apex_data.timesheet_today as tt', 'hr_details.hr_id', '=', 'tt.hr_id')
            ->leftJoin('wings_config.users', 'hr_details.user_id', '=', 'users.id')
            ->leftJoin('pulse.user_statuses', 'hr_details.user_id', '=', 'user_statuses.user_id')
            ->whereIn('hr_details.rank', ['DM', 'TM'])
            ->whereNotNull('hr_details.user_id')
            ->select(
                'hr_details.hr_id',
                'hr_details.rank',
                'hr_details.user_id',
                'hr_details.profile_photo',
                'hr_details.job_title',
                'users.name',
                'user_statuses.last_active_at',
                'tt.off_time',
                DB::raw('MAX(tt.on_time) as latest_on_time')
            )
            ->groupBy(
                'hr_details.hr_id',
                'hr_details.rank', 
                'hr_details.user_id',
                'hr_details.profile_photo',
                'hr_details.job_title',
                'users.name',
                'user_statuses.last_active_at',
                'tt.off_time'
            )
            ->orderBy('users.name', 'asc')
            ->get();

        $result = [];

        foreach ($managers as $manager) {
            // Determine if manager is currently clocked in
            $isClockedIn = $manager->latest_on_time && !$manager->off_time;
            
            // Determine online status based on Pulse activity
            $isOnline = false;
            if ($manager->last_active_at) {
                $lastActive = Carbon::parse($manager->last_active_at);
                $isOnline = $lastActive->diffInMinutes(Carbon::now()) <= 5;
            }

            $result[] = [
                'hr_id' => $manager->hr_id,
                'user_id' => $manager->user_id,
                'name' => $manager->name,
                'rank' => $manager->rank,
                'job_title' => $manager->job_title,
                'profile_photo' => $manager->profile_photo,
                'is_clocked_in' => $isClockedIn,
                'is_online' => $isOnline,
                'clocked_in_at' => $manager->latest_on_time,
                'last_active_at' => $manager->last_active_at,
            ];
        }

        return response()->json($result);
    }

    /**
     * Get latest knowledge base articles for dashboard widget
     */
    public function latestArticles(Request $request)
    {
        $category = $request->query('category');
        $search = $request->query('search');
        $limit = $request->query('limit', 5);

        // Get all unique categories
        $categories = DB::connection('pulse')
            ->table('knowledge_base_articles')
            ->select('category')
            ->where('published_at', '<=', now())
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray();

        // Get latest articles
        $articles = DB::connection('pulse')
            ->table('knowledge_base_articles')
            ->select('id', 'title', 'category', 'description', 'tags', 'visits', 'read_time', 'published_at')
            ->where('published_at', '<=', now())
            ->when($category, function ($query, $category) {
                $category = str_replace('-', ' ', $category);
                return $query->where('category', $category);
            })
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%')
                      ->orWhere('category', 'like', '%' . $search . '%')
                      ->orWhere('tags', 'like', '%' . $search . '%');
                });
            })
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();

        // Process tags - ensure they're properly formatted
        $articles = $articles->map(function ($article) {
            $tags = $article->tags;
            if (is_string($tags)) {
                $decoded = json_decode($tags, true);
                $article->tags = is_array($decoded) ? $decoded : [];
            } elseif (!is_array($tags)) {
                $article->tags = [];
            }
            return $article;
        });

        return response()->json([
            'articles' => $articles,
            'categories' => $categories,
        ]);
    }

    /**
     * Get announcements for the dashboard widget
     * Returns global announcements + team announcements for teams the user is a member of
     */
    public function announcements(Request $request)
    {
        $user = auth()->user();
        
        // Get team IDs the user is a member of
        $userTeamIds = DB::connection('pulse')
            ->table('team_user')
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->pluck('team_id')
            ->toArray();
        
        // Get global announcements + team announcements for user's teams
        $announcements = Announcement::with(['creator', 'team'])
            ->active()
            ->where(function ($query) use ($userTeamIds) {
                $query->where('scope', 'global');
                
                if (!empty($userTeamIds)) {
                    $query->orWhere(function ($q) use ($userTeamIds) {
                        $q->where('scope', 'team')
                          ->whereIn('team_id', $userTeamIds);
                    });
                }
            })
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json($announcements);
    }
}
