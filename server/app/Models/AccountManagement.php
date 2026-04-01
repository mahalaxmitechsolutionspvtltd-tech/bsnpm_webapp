<?php // AccountManagement.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountManagement extends Model
{
    use HasFactory;

    protected $table = 'account_management';

    public $timestamps = false;

    protected $fillable = [
        'member_id',
        'member_name',
        'date_of_payment',
        'applications_json',
        'total_amount',
        'payment_mode',
        'proof_file',
        'reference_trn',
        'remark',
        'status',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'date_of_payment' => 'date',
        'applications_json' => 'array',
        'total_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}