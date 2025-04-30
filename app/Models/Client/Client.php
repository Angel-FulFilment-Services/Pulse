<?php

namespace App\Models\Client;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $table = 'clients';

    protected $connection = 'wings_config';

    protected $fillable = [
        'client_ref',
        'client_name',
        'reports',
        'self_order',
    ];

}
