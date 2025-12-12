<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;

class DmPinnedMessage extends Model
{
    protected $connection = 'pulse';
    protected $table = 'dm_pinned_messages';
    
    protected $fillable = [
        'user_id_1',
        'user_id_2',
        'pinned_message_id',
        'pinned_attachment_id',
    ];
    
    public function pinnedMessage()
    {
        return $this->belongsTo(Message::class, 'pinned_message_id');
    }
}
