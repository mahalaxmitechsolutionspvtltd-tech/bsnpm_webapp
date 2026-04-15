<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dividend extends Model
{
    protected $table = 'dividends';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'financial_year',
        'dividend_rate',
        'total_payout',
        'declared_date',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'id' => 'integer',
        'financial_year' => 'string',
        'dividend_rate' => 'decimal:2',
        'total_payout' => 'decimal:2',
        'declared_date' => 'date',
        'created_by' => 'string',
        'created_at' => 'datetime',
        'updated_by' => 'string',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
        'deleted_by' => 'string',
    ];

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';
}