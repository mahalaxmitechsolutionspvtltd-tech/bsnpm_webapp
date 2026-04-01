<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanScheme extends Model
{
    protected $table = 'loan_schemes';

    protected $primaryKey = 'id';

    public $timestamps = true;

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'scheme_name',
        'loan_details',
        'interest_rate',
        'loan_max_amount',
        'created_by',
        'updated_by',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'id' => 'integer',
        'interest_rate' => 'decimal:2',
        'loan_max_amount' => 'decimal:2',
        'is_deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}