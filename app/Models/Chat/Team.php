<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Team extends Model
{
    protected $connection = 'pulse';
    protected $fillable = ['name', 'description', 'owner_id'];

    // Cross-database relationships don't work well, so we'll use helper methods
    public function getOwner()
    {
        return \App\Models\User\User::find($this->owner_id);
    }

    public function getMembers()
    {
        $userIds = \DB::connection('pulse')->table('team_user')
            ->where('team_id', $this->id)
            ->pluck('user_id');
        
        return \App\Models\User\User::whereIn('id', $userIds)->get();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
