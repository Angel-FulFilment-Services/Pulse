<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;

class TeamUser extends Model
{
    protected $connection = 'pulse';
    protected $table = 'team_user';
    protected $fillable = ['team_id', 'user_id', 'role', 'joined_at', 'left_at'];
    
    protected $casts = [
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
    ];
    
    /**
     * Get the user associated with this membership
     */
    public function getUser()
    {
        return \App\Models\User\User::find($this->user_id);
    }
    
    /**
     * Get the user relationship (for eager loading)
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User\User::class, 'user_id');
    }
    
    /**
     * Get the team associated with this membership
     */
    public function team()
    {
        return $this->belongsTo(Team::class);
    }
    
    /**
     * Scope for active members (not left)
     */
    public function scopeActive($query)
    {
        return $query->whereNull('left_at');
    }
    
    /**
     * Get all membership events (joins and leaves) for a team, ordered by time
     */
    public static function getMembershipEvents($teamId, $afterDate = null)
    {
        $query = static::where('team_id', $teamId);
        
        if ($afterDate) {
            $query->where(function($q) use ($afterDate) {
                $q->where('joined_at', '>=', $afterDate)
                  ->orWhere('left_at', '>=', $afterDate);
            });
        }
        
        return $query->get();
    }
}
