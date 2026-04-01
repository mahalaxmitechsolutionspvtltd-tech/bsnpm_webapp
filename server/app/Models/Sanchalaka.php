<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Sanchalaka extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'sanchalakas';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'sanchalak_id',
        'sanchalak_name',
        'sanchalak_email',
        'sanchalak_mobile',
        'password',
        'profile_photo',
        'status',
    ];

    protected $hidden = [
        'password',
    ];
}