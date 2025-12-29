<?php
namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;

class MessageReaction extends Model
{
    protected $connection = 'pulse';
    
    protected $fillable = [
        'message_id',
        'user_id',
        'emoji',
        'name',
    ];

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User\User::class);
    }
}
