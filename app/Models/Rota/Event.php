<?php

namespace App\Models\Rota;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Event extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

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
        'created_at' => 'date',
        'updated_at' => 'date',
    ];
}
