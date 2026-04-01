<?php
// MemberEmergencyFund.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberEmergencyFund extends Model
{
    use HasFactory;

    protected $table = 'member_emergency_fund';

    public $timestamps = false;

    protected $fillable = [
        'member_id',
        'member_name',
        'emergency_fund_amount',
        'last_payment_date',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'emergency_fund_amount' => 'decimal:2',
        'last_payment_date' => 'date',
        'updated_at' => 'datetime',
    ];
}