<?php
namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class Access extends Model
{
    protected $table = 'access_logs';

    protected $fillable = [
        'method', 'url', 'route_name', 'user_id', 'ip_address', 'x_forwarded_for',
        'user_agent', 'referrer', 'status_code', 'request_params', 'session_id',
        'user_roles', 'duration_ms'
    ];

    protected $casts = [
        'request_params' => 'array',
    ];
}