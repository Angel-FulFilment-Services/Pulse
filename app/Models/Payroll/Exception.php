<?php

namespace App\Models\Payroll;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exception extends Model
{
    use HasFactory;

    protected $table = 'exceptions';
    protected $connection = 'hr';

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
        'start_date',
        'end_date',
        'type',
        'notes',
        'quantity',
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
