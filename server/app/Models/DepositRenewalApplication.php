<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class DepositRenewalApplication extends Model
{
    protected $table = 'deposit_renewal_applications';

    protected $fillable = [
        'renewal_application_no',
        'deposit_application_id',
        'old_application_no',
        'member_id',
        'scheme_id',
        'scheme_name',
        'current_deposit_amount',
        'current_tenure_years',
        'requested_deposit_amount',
        'requested_tenure_years',
        'tenure_extension_years',
        'amount_change_type',
        'amount_multiple',
        'scheme_details',
        'investment_terms',
        'term_notes',
        'status',
        'remark',
        'updated_by',
        'is_active',
        'is_deleted',
    ];

    protected $casts = [
        'deposit_application_id' => 'integer',
        'scheme_id' => 'integer',
        'current_deposit_amount' => 'decimal:2',
        'requested_deposit_amount' => 'decimal:2',
        'amount_multiple' => 'decimal:2',
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->renewal_application_no)) {
                $model->renewal_application_no = self::generateRenewalApplicationNo(
                    $model->member_id,
                    $model->old_application_no
                );
            }
        });
    }

    public static function generateRenewalApplicationNo(?string $memberId, ?string $oldApplicationNo = null): string
    {
        $memberId = trim((string) $memberId);

        if ($memberId === '') {
            $memberId = 'MEMBER';
        }

        $schemeCode = 'RD';

        if (!empty($oldApplicationNo)) {
            $parts = explode('-', $oldApplicationNo);

            if (count($parts) >= 2 && !empty($parts[1])) {
                $schemeCode = strtoupper(trim($parts[1]));
            }
        }

        $prefix = "{$memberId}-{$schemeCode}-RN-";

        $lastRecord = self::where('renewal_application_no', 'like', $prefix . '%')
            ->select('renewal_application_no')
            ->orderByDesc('id')
            ->first();

        $nextNumber = 1;

        if ($lastRecord && !empty($lastRecord->renewal_application_no)) {
            $lastParts = explode('-RN-', $lastRecord->renewal_application_no);

            if (isset($lastParts[1]) && is_numeric($lastParts[1])) {
                $nextNumber = ((int) $lastParts[1]) + 1;
            }
        }

        return $prefix . str_pad((string) $nextNumber, 2, '0', STR_PAD_LEFT);
    }

    public function depositApplication()
    {
        return $this->belongsTo(DepositApplication::class, 'deposit_application_id');
    }

    public function scheme()
    {
        return $this->belongsTo(DepositScheme::class, 'scheme_id');
    }
}