<?php

namespace App\Helper;

use App\Models\AssignedPermissions;
use Illuminate\Support\Facades\Cache;

class Permissions
{
    public static function hasPermission($right){        
        // New Caching method
        
        if(auth()->user()){
            return auth()->user()->hasPermission($right);
        }
        
        return false;
    }
}