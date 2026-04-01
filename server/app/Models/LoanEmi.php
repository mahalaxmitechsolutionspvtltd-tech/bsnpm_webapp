<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanEmi extends Model
{
    use HasFactory;

    protected $table = 'loan_emis';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'application_no',
        'member_id',
        'member_name',
        'loan_amount',
        'start_date',
        'end_date',
        'emi_schedule',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'loan_amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'emi_schedule' => 'array',
        'created_at' => 'datetime',
    ];
}