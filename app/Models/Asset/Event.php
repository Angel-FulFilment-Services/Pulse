<?php

namespace App\Models\Asset;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $table = 'support_log';
    protected $connection = 'assets';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'hr_id',
        'user_id',
        'created_by_user_id',
        'kit_id',
        'date',
        'on_time',
        'off_time',
        'category',
        'notes',
        'resolved',
        'attachments',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        // 'created_at' => 'date',
        // 'updated_at' => 'date',
    ];
}
