<?php
namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\Team;
use App\Models\Chat\TeamUser;
use App\Models\Chat\ChatUserPreference;
use App\Models\User\User;

class TeamController extends Controller
{
    // Search teams and users for chat quick switch
    public function search(Request $request)
    {
        $q = $request->input('q');
        $userId = auth()->user()->id;
        $user = auth()->user();
        
        // Check if user has monitor all teams permission
        $hasMonitorPermission = $user->hasPermission('pulse_monitor_all_teams');
        
        if ($hasMonitorPermission) {
            // User can search all teams
            $teams = Team::where(function($query) use ($q) {
                    $query->where('name', 'like', "%$q%")
                          ->orWhere('description', 'like', "%$q%")
                          ->orWhere('id', $q);
                })
                ->orderBy('name', 'asc')
                ->limit(10)
                ->get(['id', 'name', 'description']);
        } else {
            // Get team IDs that the user is a member of using a direct query
            $teamIds = \DB::connection('pulse')->table('team_user')
                ->where('user_id', $userId)
                ->whereNull('left_at')
                ->pluck('team_id');
            
            $teams = Team::whereIn('id', $teamIds)
                ->where(function($query) use ($q) {
                    $query->where('name', 'like', "%$q%")
                          ->orWhere('description', 'like', "%$q%")
                          ->orWhere('id', $q);
                })
                ->orderBy('name', 'asc')
                ->limit(10)
                ->get(['id', 'name', 'description']);
        }

        // Get users that have had conversations with the current user for search
        $userIdsWithConversations = \DB::connection('pulse')
            ->table('messages')
            ->where(function($query) use ($userId) {
                $query->where('sender_id', $userId)
                      ->orWhere('recipient_id', $userId);
            })
            ->where('team_id', null) // Direct messages only
            ->get(['sender_id', 'recipient_id'])
            ->flatMap(function($message) use ($userId) {
                return $message->sender_id == $userId 
                    ? [$message->recipient_id] 
                    : [$message->sender_id];
            })
            ->unique()
            ->filter()
            ->values();

        $users = collect(); // Empty collection by default
        if ($userIdsWithConversations->isNotEmpty()) {
            $users = User::whereIn('id', $userIdsWithConversations)
                ->where(function($query) use ($q) {
                    $query->where('name', 'like', "%$q%")
                          ->orWhere('email', 'like', "%$q%")
                          ->orWhere('id', $q);
                })
                ->orderBy('name', 'asc')
                ->limit(10)
                ->get(['id', 'name', 'email']);
        }

        return response()->json([
            'teams' => $teams,
            'users' => $users,
        ]);
    }
    // Show a team with members
    public function show(Request $request, $teamId)
    {
        $team = Team::findOrFail($teamId);
        $userId = auth()->user()->id;
        $user = auth()->user();
        
        // Check if user has monitor permission or is a team member
        $hasMonitorPermission = $user->hasPermission('pulse_monitor_all_teams');
        $isMember = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->exists();
        
        if (!$hasMonitorPermission && !$isMember) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $members = $team->getMembers();
        $teamArr = $team->toArray();
        $teamArr['members'] = $members;
        $teamArr['current_user_role'] = $hasMonitorPermission && !$isMember ? 'monitor' : $team->getCurrentUserRole();
        return response()->json($teamArr);
    }
    // Update (edit) a team
    public function update(Request $request, $teamId)
    {
        $team = Team::findOrFail($teamId);
        if (auth()->user()->id !== $team->owner_id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        $team->update($data);
        return response()->json($team);
    }

    // Delete a team
    public function destroy(Request $request, $teamId)
    {
        $team = Team::findOrFail($teamId);
        
        // Only owner can delete the team
        if (auth()->user()->id !== $team->owner_id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        
        // Get all active team members before deleting
        $memberIds = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->whereNull('left_at')
            ->pluck('user_id');
        
        // Soft delete the team
        $team->delete();
        
        // Broadcast TeamMemberRemoved to all members so their sidebars update
        foreach ($memberIds as $memberId) {
            broadcast(new \App\Events\Chat\TeamMemberRemoved(
                (int) $memberId,
                (int) $teamId
            ));
        }
        
        return response()->json(['status' => 'deleted']);
    }
    public function index(Request $request)
    {
        $userId = auth()->user()->id;
        $user = auth()->user();
        
        // Check if user has monitor all teams permission AND has requested all teams (spy mode)
        $hasMonitorPermission = $user->hasPermission('pulse_monitor_all_teams');
        $wantsAllTeams = $request->boolean('all', false);
        
        // Get team IDs that the user is a member of, along with joined_at timestamps
        $memberTeams = \DB::connection('pulse')->table('team_user')
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->get(['team_id', 'joined_at']);
        
        $memberTeamIds = $memberTeams->pluck('team_id')->toArray();
        $memberJoinedAt = $memberTeams->pluck('joined_at', 'team_id');
        
        if ($hasMonitorPermission && $wantsAllTeams) {
            // User can see all teams (spy mode enabled)
            $teams = Team::orderBy('name', 'asc')->get();
            $teamIds = $teams->pluck('id');
        } else {
            $teamIds = collect($memberTeamIds);
            
            $teams = Team::whereIn('id', $teamIds)
                ->orderBy('name', 'asc')
                ->get();
        }
        
        // Get user's chat preferences for history_removed_at filtering
        $preferences = ChatUserPreference::where('user_id', $userId)
            ->where('chat_type', 'team')
            ->whereIn('chat_id', $teamIds)
            ->get()
            ->keyBy('chat_id');

        // Add unread_count, last_message_at, and is_member for each team
        $teams = $teams->map(function($team) use ($userId, $preferences, $memberTeamIds, $memberJoinedAt) {
            $query = $team->messages()
                ->whereDoesntHave('reads', function($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('sender_id', '!=', $userId);
            
            // Only count messages sent after the user joined the team
            $joinedAt = $memberJoinedAt->get($team->id);
            if ($joinedAt) {
                $query->where('created_at', '>=', $joinedAt);
            }
            
            // Filter by history_removed_at if set
            $preference = $preferences->get($team->id);
            if ($preference && $preference->history_removed_at) {
                $query->where('created_at', '>=', $preference->history_removed_at);
            }
            
            $team->unread_count = $query->count();
            
            // Get the last message timestamp for sorting
            $lastMessage = $team->messages()->latest('created_at')->first();
            $team->last_message_at = $lastMessage ? $lastMessage->created_at : null;
            
            // Add is_member flag
            $team->is_member = in_array($team->id, $memberTeamIds);
            
            return $team;
        });
        return response()->json($teams);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        $team = Team::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'owner_id' => auth()->user()->id,
        ]);
        
        $now = now();
        
        // Add the owner as a member using direct DB query
        \DB::connection('pulse')->table('team_user')->insert([
            'team_id' => $team->id,
            'user_id' => auth()->user()->id,
            'role' => 'owner',
            'joined_at' => $now,
            'left_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        
        // Broadcast to the creator's channel so their sidebar updates in real-time
        // (in case they have multiple tabs/windows open)
        broadcast(new \App\Events\Chat\TeamMemberAdded(
            (int) auth()->user()->id,
            [
                'id' => $team->id,
                'name' => $team->name,
                'description' => $team->description,
                'owner_id' => $team->owner_id,
                'unread_count' => 0,
                'last_message_at' => null,
            ]
        ));
        
        return response()->json($team, 201);
    }

    public function addMember(Request $request, $teamId)
    {
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'role' => 'nullable|string',
        ]);
        $team = Team::findOrFail($teamId);
        $user = User::findOrFail($data['user_id']);
        $now = now();
        
        // Check if user is currently an active member (no left_at)
        $activeMembership = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $data['user_id'])
            ->whereNull('left_at')
            ->first();
            
        if (!$activeMembership) {
            // Insert new membership record (allows multiple records for join/leave history)
            \DB::connection('pulse')->table('team_user')->insert([
                'team_id' => $teamId,
                'user_id' => $data['user_id'],
                'role' => $data['role'] ?? 'member',
                'joined_at' => $now,
                'left_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            
            // Broadcast to team channel for the join message
            broadcast(new \App\Events\Chat\TeamMemberJoined(
                (int) $teamId,
                (int) $data['user_id'],
                $user->name,
                $now->toISOString()
            ))->toOthers();
            
            // Broadcast to the added user's channel so their sidebar updates
            broadcast(new \App\Events\Chat\TeamMemberAdded(
                (int) $data['user_id'],
                [
                    'id' => $team->id,
                    'name' => $team->name,
                    'description' => $team->description,
                    'owner_id' => $team->owner_id,
                    'unread_count' => 0,
                    'last_message_at' => null,
                ]
            ));
        }
        return response()->json(['message' => 'User added.']);
    }

    public function removeMember(Request $request, $teamId, $userId)
    {
        $team = Team::findOrFail($teamId);
        $user = User::findOrFail($userId);
        $currentUserId = auth()->user()->id;
        
        // Check if current user is admin or owner
        $currentUserMembership = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $currentUserId)
            ->whereNull('left_at')
            ->first();
        
        if (!$currentUserMembership || !in_array($currentUserMembership->role, ['admin', 'owner'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        
        $now = now();
        
        // Mark the active membership as left instead of deleting
        \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->update([
                'left_at' => $now,
                'updated_at' => $now,
            ]);
        
        // Broadcast to team channel for the leave message
        broadcast(new \App\Events\Chat\TeamMemberLeft(
            (int) $teamId,
            (int) $userId,
            $user->name,
            $now->toISOString()
        ))->toOthers();
        
        // Broadcast to the removed user's channel so their sidebar updates
        broadcast(new \App\Events\Chat\TeamMemberRemoved(
            (int) $userId,
            (int) $teamId
        ));
            
        return response()->json(['message' => 'User removed.']);
    }
    
    public function updateMemberRole(Request $request, $teamId, $userId)
    {
        $data = $request->validate([
            'role' => 'required|string|in:member,admin,owner',
        ]);
        
        $team = Team::findOrFail($teamId);
        $user = User::findOrFail($userId);
        $currentUserId = auth()->user()->id;
        $now = now();
        
        // Check if current user is admin or owner
        $currentUserMembership = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $currentUserId)
            ->whereNull('left_at')
            ->first();
        
        if (!$currentUserMembership || !in_array($currentUserMembership->role, ['admin', 'owner'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        
        // Only owner can transfer ownership
        if ($data['role'] === 'owner' && $currentUserMembership->role !== 'owner') {
            return response()->json(['error' => 'Only the owner can transfer ownership'], 403);
        }
        
        // Get the target user's current membership
        $targetMembership = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->first();
        
        if (!$targetMembership) {
            return response()->json(['error' => 'User is not a member of this team'], 404);
        }
        
        $oldRole = $targetMembership->role ?? 'member';
        $newOwnerId = null;
        
        // If transferring ownership
        if ($data['role'] === 'owner') {
            // Update team owner
            $team->owner_id = $userId;
            $team->save();
            $newOwnerId = $userId;
            
            // Demote current owner to admin
            \DB::connection('pulse')->table('team_user')
                ->where('team_id', $teamId)
                ->where('user_id', $currentUserId)
                ->whereNull('left_at')
                ->update([
                    'role' => 'admin',
                    'updated_at' => $now,
                ]);
        }
        
        // Update the target user's role
        \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->update([
                'role' => $data['role'],
                'updated_at' => $now,
            ]);
        
        // Broadcast role change event
        broadcast(new \App\Events\Chat\TeamMemberRoleChanged(
            (int) $teamId,
            (int) $userId,
            $user->name,
            $oldRole,
            $data['role'],
            $newOwnerId
        ));
        
        return response()->json([
            'message' => 'Role updated.',
            'user_id' => $userId,
            'role' => $data['role'],
            'new_owner_id' => $newOwnerId,
        ]);
    }

    // Mark all messages as read for a team for the current user
    public function markRead(Request $request, $teamId)
    {
        $userId = auth()->user()->id;
        $team = Team::findOrFail($teamId);
        
        // Check if user is actually a team member
        // Monitor users should not mark messages as read (they're just observing)
        $isMember = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->exists();
        
        if (!$isMember) {
            // User is monitoring, not actually in the team - don't mark as read
            return response()->json(['status' => 'monitoring']);
        }
        
        $messages = $team->messages()
            ->whereDoesntHave('reads', function($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->where('sender_id', '!=', $userId)
            ->pluck('id');

        foreach ($messages as $messageId) {
            \App\Models\Chat\MessageRead::firstOrCreate([
                'message_id' => $messageId,
                'user_id' => $userId,
            ], [
                'read_at' => now(),
            ]);
        }
        return response()->json(['status' => 'ok']);
    }

    // Fire typing event for team chat
    public function typing(Request $request, $teamId)
    {
        $user = auth()->user();
        broadcast(new \App\Events\Chat\Typing($user->id, $user->name, $teamId))->toOthers();
        return response()->json(['status' => 'ok']);
    }

    // Get all users for compose modal
    public function users(Request $request)
    {
        $currentUserId = auth()->user()->id;
        
        // Get users that have had conversations with the current user
        $userIdsWithConversations = \DB::connection('pulse')
            ->table('messages')
            ->where(function($query) use ($currentUserId) {
                $query->where('sender_id', $currentUserId)
                      ->orWhere('recipient_id', $currentUserId);
            })
            ->where('team_id', null) // Direct messages only (not team messages)
            ->get(['sender_id', 'recipient_id'])
            ->flatMap(function($message) use ($currentUserId) {
                // Get the other user in the conversation
                return $message->sender_id == $currentUserId 
                    ? [$message->recipient_id] 
                    : [$message->sender_id];
            })
            ->unique()
            ->filter() // Remove nulls
            ->values();
        
        if ($userIdsWithConversations->isEmpty()) {
            return response()->json([]);
        }
        
        $users = User::select('id', 'name', 'email')
            ->whereIn('id', $userIdsWithConversations)
            ->where('id', '!=', $currentUserId)
            ->orderBy('name', 'asc')
            ->get();
        
        // Get user's chat preferences for history_removed_at filtering
        $preferences = ChatUserPreference::where('user_id', $currentUserId)
            ->where('chat_type', 'user')
            ->whereIn('chat_id', $userIdsWithConversations)
            ->get()
            ->keyBy('chat_id');
        
        // Add unread_count and last_message_at for each user (direct messages)
        $users = $users->map(function($user) use ($currentUserId, $preferences) {
            $query = \DB::connection('pulse')
                ->table('messages')
                ->where('sender_id', $user->id)
                ->where('recipient_id', $currentUserId)
                ->where('team_id', null) // Direct messages only
                ->whereNotExists(function($q) use ($currentUserId) {
                    $q->select(\DB::raw(1))
                          ->from('message_reads')
                          ->whereColumn('message_reads.message_id', 'messages.id')
                          ->where('message_reads.user_id', $currentUserId);
                });
            
            // Filter by history_removed_at if set
            $preference = $preferences->get($user->id);
            if ($preference && $preference->history_removed_at) {
                $query->where('created_at', '>=', $preference->history_removed_at);
            }
            
            $user->unread_count = $query->count();
            
            // Get the last message timestamp for sorting
            $lastMessage = \DB::connection('pulse')
                ->table('messages')
                ->where(function($query) use ($currentUserId, $user) {
                    $query->where(function($q) use ($currentUserId, $user) {
                        $q->where('sender_id', $currentUserId)
                          ->where('recipient_id', $user->id);
                    })->orWhere(function($q) use ($currentUserId, $user) {
                        $q->where('sender_id', $user->id)
                          ->where('recipient_id', $currentUserId);
                    });
                })
                ->where('team_id', null)
                ->orderBy('created_at', 'desc')
                ->first();
                
            $user->last_message_at = $lastMessage ? $lastMessage->created_at : null;
            
            return $user;
        });
        
        return response()->json($users);
    }
    
    // Get all users for compose functionality
    public function allUsers(Request $request)
    {
        // Get all users
        $users = User::select('id', 'name', 'email')
            ->where('id', '!=', auth()->user()->id)
            ->where('client_ref', '=', 'ANGL')
            ->where('active', 1)
            ->orderBy('name', 'asc')
            ->get();
            
        return response()->json($users);
    }

    /**
     * Leave a team - removes current user from team membership
     */
    public function leave(Request $request, $teamId)
    {
        $user = auth()->user();
        $userId = $user->id;
        $team = Team::findOrFail($teamId);
        
        // Don't allow leaving if user is the owner (cast to int for comparison)
        if ((int) $team->owner_id === (int) $userId) {
            return response()->json([
                'error' => 'Team owner cannot leave the team. Please transfer ownership or delete the team instead.'
            ], 403);
        }
        
        $now = now();
        
        // Mark the active membership as left instead of deleting
        \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->update([
                'left_at' => $now,
                'updated_at' => $now,
            ]);
        
        // Broadcast the event
        broadcast(new \App\Events\Chat\TeamMemberLeft(
            (int) $teamId,
            (int) $userId,
            $user->name,
            $now->toISOString()
        ))->toOthers();
            
        return response()->json([
            'status' => 'left',
            'message' => 'You have left the team successfully.'
        ]);
    }
    
    /**
     * Get the nearest shift for a user (closest to current date/time)
     */
    public function getUserShift(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        
        // Get hr_id from hr_details for this user
        $hrDetails = \DB::table('wings_data.hr_details')
            ->where('user_id', $userId)
            ->first();
        
        if (!$hrDetails || !$hrDetails->hr_id) {
            return response()->json(['shift' => null]);
        }
        
        $hrId = $hrDetails->hr_id;
        $now = \Carbon\Carbon::now();
        $today = $now->format('Y-m-d');
        
        // First, try to find a shift that's currently happening (today, and current time is within shift hours)
        $currentShift = \DB::connection('halo_rota')
            ->table('shifts2')
            ->where('hr_id', $hrId)
            ->where('shiftdate', $today)
            ->whereRaw('? BETWEEN shiftstart AND shiftend', [$now->format('H:i:s')])
            ->first();
        
        if ($currentShift) {
            return response()->json([
                'shift' => [
                    'date' => $currentShift->shiftdate,
                    'start' => $currentShift->shiftstart,
                    'end' => $currentShift->shiftend,
                    'is_current' => true,
                ]
            ]);
        }
        
        // Find the next upcoming shift (today or future)
        $upcomingShift = \DB::connection('halo_rota')
            ->table('shifts2')
            ->where('hr_id', $hrId)
            ->where(function($query) use ($today, $now) {
                $query->where('shiftdate', '>', $today)
                    ->orWhere(function($q) use ($today, $now) {
                        $q->where('shiftdate', $today)
                          ->where('shiftstart', '>', $now->format('H:i:s'));
                    });
            })
            ->orderBy('shiftdate', 'asc')
            ->orderBy('shiftstart', 'asc')
            ->first();
        
        if ($upcomingShift) {
            return response()->json([
                'shift' => [
                    'date' => $upcomingShift->shiftdate,
                    'start' => $upcomingShift->shiftstart,
                    'end' => $upcomingShift->shiftend,
                    'is_current' => false,
                    'is_upcoming' => true,
                ]
            ]);
        }
        
        // If no upcoming shift, find the most recent past shift
        $pastShift = \DB::connection('halo_rota')
            ->table('shifts2')
            ->where('hr_id', $hrId)
            ->where(function($query) use ($today, $now) {
                $query->where('shiftdate', '<', $today)
                    ->orWhere(function($q) use ($today, $now) {
                        $q->where('shiftdate', $today)
                          ->where('shiftend', '<', $now->format('H:i:s'));
                    });
            })
            ->orderBy('shiftdate', 'desc')
            ->orderBy('shiftend', 'desc')
            ->first();
        
        if ($pastShift) {
            return response()->json([
                'shift' => [
                    'date' => $pastShift->shiftdate,
                    'start' => $pastShift->shiftstart,
                    'end' => $pastShift->shiftend,
                    'is_current' => false,
                    'is_past' => true,
                ]
            ]);
        }
        
        return response()->json(['shift' => null]);
    }
}
