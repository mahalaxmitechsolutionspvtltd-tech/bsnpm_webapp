<?php
// MemberJoiningFee.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberJoiningFee extends Model
{
    use HasFactory;

    protected $table = 'members_joining_fees';

    public $timestamps = false;

    protected $fillable = [
        'member_id',
        'member_name',
        'joining_fee_amount',
        'last_payment_date',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'joining_fee_amount' => 'decimal:2',
        'last_payment_date' => 'date',
        'updated_at' => 'datetime',
    ];
}