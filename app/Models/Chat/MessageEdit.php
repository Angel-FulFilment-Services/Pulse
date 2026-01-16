<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageEdit extends Model
{
    protected $connection = 'pulse';
    
    protected $fillable = [
        'message_id',
        'body'
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}
