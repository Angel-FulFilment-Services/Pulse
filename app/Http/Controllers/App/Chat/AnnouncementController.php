<?php

namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\Announcement;
use App\Models\Chat\Team;
use App\Events\Chat\AnnouncementCreated;
use App\Events\Chat\AnnouncementDismissed;

class AnnouncementController extends Controller
{
    /**
     * Get active announcements for the current context
     * 
     * For team chats: returns global announcements + team-specific announcements
     * For DMs: returns only global announcements
     */
    public function index(Request $request)
    {
        $teamId = $request->input('team_id');
        $recipientId = $request->input('recipient_id');
        
        $query = Announcement::with('creator')
            ->active()
            ->orderBy('created_at', 'desc');
        
        if ($teamId) {
            // Team chat: get global + team-specific announcements
            $query->where(function ($q) use ($teamId) {
                $q->where('scope', 'global')
                  ->orWhere(function ($q2) use ($teamId) {
                      $q2->where('scope', 'team')
                         ->where('team_id', $teamId);
                  });
            });
        } else {
            // DM: only global announcements
            $query->where('scope', 'global');
        }
        
        $announcements = $query->get();
        
        return response()->json($announcements);
    }

    /**
     * Create a new announcement
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500',
            'scope' => 'required|in:global,team',
            'team_id' => 'required_if:scope,team|nullable|integer',
            'duration' => 'required|in:1h,3h,6h,12h,1d,3d,7d',
        ]);
        
        // Check permissions
        $user = auth()->user();
        
        if ($validated['scope'] === 'global') {
            // Check for global announcement permission
            if (!$user->hasPermission('pulse_chat_global_announcements')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        } else {
            // Check for team announcement permission
            if (!$user->hasPermission('pulse_chat_team_announcements')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            // Verify user is a member of the team
            $team = Team::find($validated['team_id']);
            if (!$team) {
                return response()->json(['error' => 'Team not found'], 404);
            }
            
            // Check membership using the team_user table directly
            $isMember = \DB::connection('pulse')->table('team_user')
                ->where('team_id', $team->id)
                ->where('user_id', $user->id)
                ->whereNull('left_at')
                ->exists();
                
            if (!$isMember) {
                return response()->json(['error' => 'You must be a member of this team'], 403);
            }
        }
        
        // Calculate expiration time based on duration
        $expiresAt = match($validated['duration']) {
            '1h' => now()->addHour(),
            '3h' => now()->addHours(3),
            '6h' => now()->addHours(6),
            '12h' => now()->addHours(12),
            '1d' => now()->addDay(),
            '3d' => now()->addDays(3),
            '7d' => now()->addWeek(),
            default => now()->addDay(),
        };
        
        $announcement = Announcement::create([
            'message' => $validated['message'],
            'created_by' => $user->id,
            'scope' => $validated['scope'],
            'team_id' => $validated['scope'] === 'team' ? $validated['team_id'] : null,
            'expires_at' => $expiresAt,
        ]);
        
        // Load the creator relationship
        $announcement->load('creator');
        
        // Broadcast the announcement
        broadcast(new AnnouncementCreated($announcement))->toOthers();
        
        return response()->json([
            'status' => 'created',
            'announcement' => $announcement,
        ]);
    }

    /**
     * Dismiss/delete an announcement
     */
    public function destroy(Request $request, $announcementId)
    {
        $announcement = Announcement::findOrFail($announcementId);
        $user = auth()->user();
        
        // Check permissions - only creator or admins can dismiss
        if ($announcement->scope === 'global') {
            if (!$user->hasPermission('pulse_chat_global_announcements')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        } else {
            // For team announcements, check if user has permission or is the creator
            if ($announcement->created_by !== $user->id && !$user->hasPermission('pulse_chat_team_announcements')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }
        
        // Store the announcement data before deletion for broadcasting
        $announcementData = [
            'id' => $announcement->id,
            'scope' => $announcement->scope,
            'team_id' => $announcement->team_id,
        ];
        
        $announcement->delete();
        
        // Broadcast the dismissal
        broadcast(new AnnouncementDismissed($announcementData))->toOthers();
        
        return response()->json(['status' => 'dismissed']);
    }
    
    /**
     * Get a single announcement
     */
    public function show($announcementId)
    {
        $announcement = Announcement::with('creator')->findOrFail($announcementId);
        
        return response()->json($announcement);
    }
}
