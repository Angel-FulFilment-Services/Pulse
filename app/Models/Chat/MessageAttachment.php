<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MessageAttachment extends Model
{
    protected $connection = 'pulse';
    protected $table = 'message_attachments';

    protected $fillable = [
        'message_id',
        'file_name',
        'file_type',
        'file_size',
        'mime_type',
        'storage_path',
        'thumbnail_path',
        'is_image',
        'storage_driver',
    ];

    protected $casts = [
        'is_image' => 'boolean',
        'file_size' => 'integer',
    ];

    protected $appends = ['url', 'thumbnail_url', 'file_size_formatted'];

    /**
     * Get the message that owns the attachment
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Get the reactions for the attachment
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(AttachmentReaction::class, 'attachment_id');
    }

    /**
     * Get the URL for the attachment
     */
    public function getUrlAttribute(): string
    {
        return route('chat.attachments.proxy', ['id' => $this->id]);
    }

    /**
     * Get the thumbnail URL for the attachment
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        if ($this->thumbnail_path) {
            return route('chat.attachments.proxy', [
                'id' => $this->id,
                'thumbnail' => true
            ]);
        }
        return null;
    }

    /**
     * Get formatted file size
     */
    public function getFileSizeFormattedAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }

    /**
     * Check if file is previewable
     */
    public function isPreviewable(): bool
    {
        $previewableTypes = ['image', 'pdf', 'video', 'audio'];
        return in_array($this->file_type, $previewableTypes);
    }

    /**
     * Get file extension
     */
    public function getExtension(): string
    {
        return pathinfo($this->file_name, PATHINFO_EXTENSION);
    }
}
