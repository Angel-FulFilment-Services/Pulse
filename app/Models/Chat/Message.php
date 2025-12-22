<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected $connection = 'pulse';
    protected $fillable = [
        'team_id', 'sender_id', 'recipient_id', 'body', 'mentions', 'type', 'is_edited', 'edited_at', 'sent_at', 'reply_to_message_id', 'reply_to_attachment_id', 'deleted_at', 'forwarded_from_message_id'
    ];

    protected $casts = [
        'edited_at' => 'datetime',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User\User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User\User::class, 'recipient_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    public function reads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }
    
    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User\User::class, 'sender_id');
    }
    
    public function replyToMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_message_id');
    }
    
    public function replyToAttachment(): BelongsTo
    {
        return $this->belongsTo(MessageAttachment::class, 'reply_to_attachment_id');
    }
    
    public function forwardedFromMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'forwarded_from_message_id');
    }
    
    public function edits(): HasMany
    {
        return $this->hasMany(MessageEdit::class);
    }
}
