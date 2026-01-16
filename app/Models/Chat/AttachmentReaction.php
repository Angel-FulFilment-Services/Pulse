<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;
use App\Models\User\User;

class AttachmentReaction extends Model
{
    protected $connection = 'pulse';
    
    protected $fillable = [
        'attachment_id',
        'user_id',
        'emoji',
        'name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function attachment()
    {
        return $this->belongsTo(MessageAttachment::class, 'attachment_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
