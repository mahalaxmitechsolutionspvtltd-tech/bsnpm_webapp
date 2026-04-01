<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepositInstallment extends Model
{
    protected $table = 'deposit_installments';

    public $timestamps = false;

    protected $fillable = [
        'member_id',
        'member_name',
        'application_no',
        'start_date',
        'end_date',
        'installment_json',
        'amount',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'installment_json' => 'array',
        'amount' => 'float',
        'updated_at' => 'datetime',
    ];

    public function setInstallmentJsonAttribute($value): void
    {
        if (is_array($value) || is_object($value)) {
            $this->attributes['installment_json'] = json_encode($value, JSON_UNESCAPED_UNICODE);
            return;
        }

        $this->attributes['installment_json'] = $value;
    }

    public function getInstallmentJsonAttribute($value): array
    {
        if (empty($value)) {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }
}