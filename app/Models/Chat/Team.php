<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Team extends Model
{
    use SoftDeletes;
    
    protected $connection = 'pulse';
    protected $fillable = ['name', 'description', 'owner_id', 'pinned_message_id'];

    // Cross-database relationships don't work well, so we'll use helper methods
    public function getOwner()
    {
        return \App\Models\User\User::find($this->owner_id);
    }

    public function getMembers()
    {
        $memberships = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $this->id)
            ->whereNull('left_at')
            ->get(['user_id', 'role']);
        
        $userIds = $memberships->pluck('user_id');
        $rolesMap = $memberships->pluck('role', 'user_id');
        
        $users = \App\Models\User\User::whereIn('id', $userIds)->get();
        
        // Add role to each user
        return $users->map(function($user) use ($rolesMap) {
            $user->role = $rolesMap[$user->id] ?? 'member';
            return $user;
        });
    }
    
    /**
     * Get the current user's role in this team
     */
    public function getCurrentUserRole()
    {
        $userId = auth()->user()->id;
        
        $membership = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $this->id)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->first(['role']);
        
        return $membership ? ($membership->role ?? 'member') : null;
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
    
    public function pinnedMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'pinned_message_id');
    }
}
