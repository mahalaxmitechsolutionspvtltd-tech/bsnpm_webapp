<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrialBalance extends Model
{
    use HasFactory;

    protected $table = 'trial_balance';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'financial_year',
        'opening_balance',
        'cash_in_hand',
        'bank_balance',
        'closing_balance',
        'debit_json',
        'credit_json',
        'updated_by',
        'updated_at',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'cash_in_hand' => 'decimal:2',
        'bank_balance' => 'decimal:2',
        'closing_balance' => 'decimal:2',
        'debit_json' => 'array',
        'credit_json' => 'array',
        'updated_at' => 'datetime',
        'created_at' => 'datetime',
    ];
}