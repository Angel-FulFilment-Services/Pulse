<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $connection = 'pulse';
    protected $table = 'messages';
    
    protected $fillable = [
        'team_id',
        'sender_id',
        'recipient_id',
        'body',
        'mentions',
        'type',
        'is_edited',
        'sent_at'
    ];

    protected $casts = [
        'mentions' => 'array',
        'is_edited' => 'boolean',
        'sent_at' => 'datetime'
    ];
}