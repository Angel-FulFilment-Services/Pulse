<?php

namespace App\Models\Rota;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $table = 'events';
    protected $connection = 'apex_data';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'hr_id',
        'user_id',
        'created_by_user_id',
        'date',
        'shift_id',
        'on_time',
        'off_time',
        'category',
        'notes',
        'requires_action',
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
