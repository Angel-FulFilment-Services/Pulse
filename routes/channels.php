<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// User private channel (for notifications)
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Chat user private channel (for read receipts)
Broadcast::channel('chat.user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Chat team channels
Broadcast::channel('chat.team.{teamId}', function ($user, $teamId) {
    // Check if user has monitor permission (can view all teams)
    if ($user->hasPermission('pulse_monitor_all_teams')) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => 'monitor'];
    }
    
    // Check if user is an active member of this team (not left)
    $membership = \DB::connection('pulse')->table('team_user')
        ->where('team_id', $teamId)
        ->where('user_id', $user->id)
        ->whereNull('left_at')
        ->first();
    
    if ($membership) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => $membership->role];
    }
    
    return false;
});

// Chat DM channels
Broadcast::channel('chat.dm.{userId1}.{userId2}', function ($user, $userId1, $userId2) {
    // User can access if they're one of the participants
    // For presence channels, we need to return user info
    if ((int) $user->id === (int) $userId1 || (int) $user->id === (int) $userId2) {
        return ['id' => $user->id, 'name' => $user->name];
    }
    
    return false;
});
