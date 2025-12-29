<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class ChatNotificationSettings extends Model
{
    protected $connection = 'pulse';
    
    protected $table = 'chat_notification_settings';
    
    protected $fillable = [
        'user_id',
        'global_mute',
        'global_hide_preview',
    ];
    
    protected $casts = [
        'global_mute' => 'boolean',
        'global_hide_preview' => 'boolean',
    ];
    
    /**
     * Get or create settings for a user
     */
    public static function getForUser($userId)
    {
        return static::firstOrCreate(
            ['user_id' => $userId],
            [
                'global_mute' => false,
                'global_hide_preview' => false,
            ]
        );
    }
}
