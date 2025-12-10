<?php
namespace App\Http\Controllers\App\Chat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat\Team;
use App\Models\Chat\TeamUser;
use App\Models\User\User;

class TeamController extends Controller
{
    // Search teams and users for chat quick switch
    public function search(Request $request)
    {
        $q = $request->input('q');
        $userId = auth()->user()->id;
        
        // Get team IDs that the user is a member of using a direct query
        $teamIds = \DB::connection('pulse')->table('team_user')
            ->where('user_id', $userId)
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
        $members = $team->getMembers();
        $teamArr = $team->toArray();
        $teamArr['members'] = $members;
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
        if (auth()->user()->id !== $team->owner_id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        $team->delete();
        return response()->json(['status' => 'deleted']);
    }
    public function index(Request $request)
    {
        $userId = auth()->user()->id;
        
        // Get team IDs that the user is a member of using a direct query
        $teamIds = \DB::connection('pulse')->table('team_user')
            ->where('user_id', $userId)
            ->pluck('team_id');
        
        $teams = Team::whereIn('id', $teamIds)
            ->orderBy('name', 'asc')
            ->get();

        // Add unread_count for each team
        $teams = $teams->map(function($team) use ($userId) {
            $unread = $team->messages()
                ->whereDoesntHave('reads', function($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->where('sender_id', '!=', $userId)
                ->count();
            $team->unread_count = $unread;
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
        
        // Add the owner as a member using direct DB query
        \DB::connection('pulse')->table('team_user')->insert([
            'team_id' => $team->id,
            'user_id' => auth()->user()->id,
            'role' => 'owner',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        return response()->json($team, 201);
    }

    public function addMember(Request $request, $teamId)
    {
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'role' => 'nullable|string',
        ]);
        $team = Team::findOrFail($teamId);
        
        // Check for duplicates using direct DB query
        $exists = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $data['user_id'])
            ->exists();
            
        if (!$exists) {
            \DB::connection('pulse')->table('team_user')->insert([
                'team_id' => $teamId,
                'user_id' => $data['user_id'],
                'role' => $data['role'] ?? 'member',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        return response()->json(['message' => 'User added.']);
    }

    public function removeMember(Request $request, $teamId, $userId)
    {
        $team = Team::findOrFail($teamId);
        \DB::connection('pulse')->table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $userId)
            ->delete();
        return response()->json(['message' => 'User removed.']);
    }

    // Mark all messages as read for a team for the current user
    public function markRead(Request $request, $teamId)
    {
        $userId = auth()->user()->id;
        $team = Team::findOrFail($teamId);
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
            ->orderBy('name', 'asc')
            ->get();
        
        // Add unread_count for each user (direct messages)
        $users = $users->map(function($user) use ($currentUserId) {
            $unread = \DB::connection('pulse')
                ->table('messages')
                ->where('sender_id', $user->id)
                ->where('recipient_id', $currentUserId)
                ->where('team_id', null) // Direct messages only
                ->whereNotExists(function($query) use ($currentUserId) {
                    $query->select(\DB::raw(1))
                          ->from('message_reads')
                          ->whereColumn('message_reads.message_id', 'messages.id')
                          ->where('message_reads.user_id', $currentUserId);
                })
                ->count();
            
            $user->unread_count = $unread;
            return $user;
        });
        
        return response()->json($users);
    }
    
    // Get all users for compose functionality
    public function allUsers(Request $request)
    {
        // Get all users
        $users = User::select('id', 'name', 'email')
            ->where('client_ref', '=', 'ANGL')
            ->where('active', 1)
            ->orderBy('name', 'asc')
            ->get();
            
        return response()->json($users);
    }
}
