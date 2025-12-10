<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageAttachment extends Model
{
    protected $connection = 'pulse';
    protected $fillable = [
        'message_id', 'file_path', 'file_type', 'file_name', 'uploaded_by'
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User\User::class, 'uploaded_by');
    }
}
