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
    // Check if user is a member of this team
    return \DB::connection('pulse')->table('team_user')
        ->where('team_id', $teamId)
        ->where('user_id', $user->id)
        ->exists();
});

// Chat DM channels
Broadcast::channel('chat.dm.{userId1}.{userId2}', function ($user, $userId1, $userId2) {
    // User can access if they're one of the participants
    \Log::info('Channel authorization attempt', [
        'user_id' => $user->id,
        'userId1' => $userId1,
        'userId2' => $userId2,
        'authorized' => ((int) $user->id === (int) $userId1 || (int) $user->id === (int) $userId2)
    ]);
    
    // For presence channels, we need to return user info
    if ((int) $user->id === (int) $userId1 || (int) $user->id === (int) $userId2) {
        return ['id' => $user->id, 'name' => $user->name];
    }
    
    return false;
});
