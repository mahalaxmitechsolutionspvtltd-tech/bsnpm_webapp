<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepositWithdrawal extends Model
{
    use HasFactory;

    protected $table = 'deposit_withdrawals';

    protected $primaryKey = 'id';

    public $timestamps = true;

    protected $fillable = [
        'member_id',
        'application_no',
        'scheme_name',
        'total_installments_paid',
        'total_amount_paid',
        'calculated_interest',
        'final_maturity_amount',
        'requested_amount',
        'status',
        'updated_by',
        'is_deleted',
    ];

    protected $casts = [
        'total_installments_paid' => 'integer',
        'total_amount_paid' => 'decimal:2',
        'calculated_interest' => 'decimal:2',
        'final_maturity_amount' => 'decimal:2',
        'requested_amount' => 'decimal:2',
        'is_deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public const STATUS_PENDING = 'PENDING';
    public const STATUS_APPROVED = 'APPROVED';
    public const STATUS_REJECTED = 'REJECTED';

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_deleted', 0);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }
}