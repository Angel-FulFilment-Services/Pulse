<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Audit extends Model
{
    use HasFactory;

    protected $table = 'audit_log_pulse';

    protected $fillable=[
        'type',
        'user_id',
        'action',
        'notes',
        'actioned'
    ];

}
