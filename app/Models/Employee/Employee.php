<?php

namespace App\Models\Employee;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Casts\EncryptedWithCustomKey;

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

    protected $casts = [
        'contact_mobile_phone' => EncryptedWithCustomKey::class,
        'contact_home_phone' => EncryptedWithCustomKey::class,
        'contact_home_email' => EncryptedWithCustomKey::class,
        'dob' => EncryptedWithCustomKey::class,
        'title' => EncryptedWithCustomKey::class,
        'firstname' => EncryptedWithCustomKey::class,
        'surname' => EncryptedWithCustomKey::class,
        'home_address1' => EncryptedWithCustomKey::class,
        'home_address2' => EncryptedWithCustomKey::class,
        'home_address3' => EncryptedWithCustomKey::class,
        'home_town' => EncryptedWithCustomKey::class,
        'home_county' => EncryptedWithCustomKey::class,
        'home_postcode' => EncryptedWithCustomKey::class,
        'kin1_fullname' => EncryptedWithCustomKey::class,
        'kin1_relation' => EncryptedWithCustomKey::class,
        'kin1_home_phone' => EncryptedWithCustomKey::class,
        'kin1_mobile_phone' => EncryptedWithCustomKey::class,
        'kin2_fullname' => EncryptedWithCustomKey::class,
        'kin2_relation' => EncryptedWithCustomKey::class,
        'kin2_home_phone' => EncryptedWithCustomKey::class,
        'kin2_mobile_phone' => EncryptedWithCustomKey::class,
    ];
}
