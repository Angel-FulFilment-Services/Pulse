<?php

namespace App\Models\Employee;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $table = 'hr_details';

    protected $connection = 'wings_data';

    protected $fillable = [
        'user_id',
        'hr_id',
        'date_of_birth',
    ];
}
