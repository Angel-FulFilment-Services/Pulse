<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;

class TeamUser extends Model
{
    protected $connection = 'pulse';
    protected $table = 'team_user';
    protected $fillable = ['team_id', 'user_id', 'role'];
}
