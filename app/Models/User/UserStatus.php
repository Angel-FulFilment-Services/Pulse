<?php

namespace App\Models\User;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User\User;

class UserStatus extends Model
{
    protected $connection = 'pulse';
    protected $fillable = [
        'user_id', 'status', 'last_active_at'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
