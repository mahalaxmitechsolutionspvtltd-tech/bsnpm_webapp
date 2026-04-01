<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanApplicationDeduction extends Model
{
    use HasFactory;

    protected $table = 'loan_application_deductions';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'application_no',
        'member_id',
        'member_name',
        'applied_date',
        'start_date',
        'end_date',
        'loan_amount',
        'kayam_thev_amount',
        'loan_processing_fee',
        'loan_form_fee',
        'total_deductions',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
        'is_deducted',
    ];

    protected $casts = [
        'applied_date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'loan_amount' => 'decimal:2',
        'kayam_thev_amount' => 'decimal:2',
        'loan_processing_fee' => 'decimal:2',
        'loan_form_fee' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deducted' => 'boolean',
    ];
}