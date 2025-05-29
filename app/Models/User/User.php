<?php

namespace App\Models\User;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\User\AssignedPermissions;
use App\Models\HR\Employee;
use App\Models\Client\Client;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'pulse_two_factor_code', 
        'pulse_two_factor_expires_at',
        'login_attempt',
        'active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function client(){
        return $this->belongsTo(Client::class, 'client_ref', 'client_ref');
    }

    public function assignedPermissions()
    {
        $userPermissions = $this->assignedPermissionsUser;

        $clientPermissions = $this->clientAssignedPermissions();

        return $userPermissions->merge($clientPermissions);
    }

    public function Employee(): HasOne
    {
        return $this->hasOne(Employee::class, 'user_id');
    }

    public function assignedPermissionsUser()
    {
        return $this->hasMany(AssignedPermissions::class, 'user_id', 'id');
    }

    public function clientAssignedPermissions()
    {
        if (!$this->client) {
            return collect();
        }
        return AssignedPermissions::where('client_id', $this->client->id)->get();
    }

    public function hasPermission($permission)
    {
        return $this->assignedPermissions()->where('right', $permission)->isNotEmpty();
    }

    public function generate_two_factor_code(): void
    {
        $this->timestamps = false;
        $this->pulse_two_factor_code = strtoupper(substr(bin2hex(random_bytes(6)), 0, 6));
        $this->pulse_two_factor_expires_at = now()->addMinutes(10);
        $this->save();
    }

    public function reset_two_factor_code(): void
    {
        $this->timestamps = false;
        $this->pulse_two_factor_code = null;
        $this->pulse_two_factor_expires_at = null;
        $this->save();
    }
}
