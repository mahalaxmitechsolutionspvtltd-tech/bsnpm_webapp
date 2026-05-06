<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Sanchalak extends Authenticatable
{
    use HasFactory, Notifiable;

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

    protected $casts = [
        'id' => 'integer',
        'status' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Sanchalak $sanchalak): void {
            if (!empty($sanchalak->sanchalak_id)) {
                return;
            }

            $lastSanchalak = self::query()
                ->whereNotNull('sanchalak_id')
                ->where('sanchalak_id', 'LIKE', 'BSNPS%')
                ->orderByDesc('id')
                ->first();

            $nextNumber = 1;

            if ($lastSanchalak && preg_match('/^BSNPS(\d+)$/', $lastSanchalak->sanchalak_id, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }

            $sanchalak->sanchalak_id = 'BSNPS' . str_pad((string) $nextNumber, 2, '0', STR_PAD_LEFT);
        });
    }
}