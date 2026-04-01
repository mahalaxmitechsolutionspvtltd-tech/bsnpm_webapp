<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class DepositScheme extends Model
{
    protected $table = 'deposit_schemes';

    protected $fillable = [
        'scheme_name',
        'scheme_details',
        'interest_rate',
        'term_notes',
        'investment_terms',
        'created_by',
        'created_at',
        'updated_by',
        'updated_at',
        'is_deleted',
        'deleted_by',
    ];

    protected $casts = [
        'interest_rate' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_deleted', 0);
    }

    public function scopeDeleted(Builder $query): Builder
    {
        return $query->where('is_deleted', 1);
    }
}