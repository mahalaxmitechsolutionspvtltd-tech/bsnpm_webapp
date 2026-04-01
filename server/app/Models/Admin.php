<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'admins';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'admin_name',
        'admin_email',
        'admin_mobile',
        'password',
        'profile_photo',
        'status',
    ];

    protected $hidden = [
        'password',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($admin) {

            if (!$admin->admin_id) {

                $last = self::orderBy('id', 'desc')->first();

                if ($last && $last->admin_id) {
                    $number = (int) substr($last->admin_id, 5);
                    $nextNumber = $number + 1;
                } else {
                    $nextNumber = 1;
                }

                $admin->admin_id = 'BSNPA' . str_pad($nextNumber, 2, '0', STR_PAD_LEFT);
            }
        });
    }
}