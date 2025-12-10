<?php
namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;

class ChatFavorite extends Model
{
    protected $connection = 'pulse';
    protected $fillable = [
        'user_id', 'favorite_id', 'type', 'order',
    ];
}
