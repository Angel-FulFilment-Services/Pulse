<?php

namespace App\Models\Asset;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PAT extends Model
{
    use HasFactory;

    protected $table = 'pat_testing';
    protected $connection = 'assets';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'asset_id',
        'datetime',
        'expires',
        'user_id',
        'hr_id',
        'class',
        'vi_socket',
        'vi_plug',
        'vi_switch',
        'vi_flex',
        'vi_body',
        'vi_environment',
        'vi_continued_use',
        'ins_resis',
        'earth_cont',
        'polarity',
        'leakage',
        'continuity',
        'result',
        'comments',
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
