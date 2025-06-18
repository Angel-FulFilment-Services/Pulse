<?php

namespace App\Models\Asset;

use Illuminate\Database\Eloquent\Model;

class EquipmentReturn extends Model
{
    protected $connection = 'assets';
    protected $table = 'return_log';
    
    protected $fillable = [
        'datetime',
        'kit_id',
        'notes',
        'attachments',
        'items_faulty',
        'items_damaged',
        'items_functioning',
        'items_not_returned',
        'returned_by_hr_id',
        'returned_by_user_id',
        'processed_by_hr_id',
        'processed_by_user_id',
    ];
    
    
}