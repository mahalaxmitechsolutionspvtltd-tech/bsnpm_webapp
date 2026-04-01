<?php
// MemberShareCapital.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberShareCapital extends Model
{
    use HasFactory;

    protected $table = 'member_share_capital';

    public $timestamps = false;

    protected $fillable = [
        'member_id',
        'member_name',
        'share_capital_amount',
        'last_payment_date',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'share_capital_amount' => 'decimal:2',
        'last_payment_date' => 'date',
        'updated_at' => 'datetime',
    ];
}