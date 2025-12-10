<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserStatus extends Model
{
    protected $connection = 'pulse';
    protected $fillable = [
        'user_id', 'status', 'last_active_at'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User\User::class);
    }
}
