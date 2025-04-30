<?php

namespace App\Models\User;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\UserPermissions;
use App\Events\PermissionChanged;

class AssignedPermissions extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'user_id',
        'client_id',
        'right',
        'right_id',
    ];

    protected $dispatchesEvents = [
        'created' => PermissionChanged::class,
        'updated' => PermissionChanged::class,
        'deleted' => PermissionChanged::class,
    ];

    public function permission()
    {
        return $this->belongsTo(UserPermissions::class, 'right_id', 'id');
    }
}
