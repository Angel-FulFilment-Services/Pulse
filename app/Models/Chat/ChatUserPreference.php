<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;

class ChatUserPreference extends Model
{
    protected $connection = 'pulse';
    protected $table = 'chat_user_preferences';
    
    protected $fillable = [
        'user_id',
        'chat_id',
        'chat_type', // 'team' or 'user'
        'is_muted',
        'is_hidden',
        'last_read_at',
        'history_removed_at'
    ];

    protected $casts = [
        'is_muted' => 'boolean',
        'is_hidden' => 'boolean',
        'last_read_at' => 'datetime',
        'history_removed_at' => 'datetime'
    ];
}
