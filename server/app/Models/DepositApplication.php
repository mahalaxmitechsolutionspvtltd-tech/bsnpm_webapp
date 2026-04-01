<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepositApplication extends Model
{
    protected $table = 'deposit_applications';

    protected $primaryKey = 'id';

    public $timestamps = true;

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'application_no',
        'application_type',
        'member_id',
        'member_name',
        'member_email',
        'scheme_id',
        'scheme_name',
        'interest_rate',
        'tenure_years',
        'deposit_amount',
        'start_date',
        'end_date',
        'status',
        'is_active',
        'is_withdrawal',
        'is_renewed',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'id' => 'integer',
        'member_id' => 'string',
        'scheme_id' => 'integer',
        'interest_rate' => 'decimal:2',
        'tenure_years' => 'integer',
        'deposit_amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'is_withdrawal' => 'boolean',
        'is_renewed' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->application_no)) {
                $model->application_no = static::generateApplicationNo($model->scheme_name);
            }

            if (empty($model->application_type)) {
                $model->application_type = 'New';
            }
        });
    }

    public function scheme()
    {
        return $this->belongsTo(DepositScheme::class, 'scheme_id');
    }

    public static function generateApplicationNo(?string $schemeName = null): string
    {
        $prefix = 'BSNPM01';
        $schemeCode = static::makeSchemeCode($schemeName);

        $lastRecord = static::where('application_no', 'like', $prefix . '-' . $schemeCode . '-%')
            ->orderByDesc('id')
            ->first();

        $nextNumber = 1;

        if ($lastRecord && !empty($lastRecord->application_no)) {
            $parts = explode('-', $lastRecord->application_no);
            $lastNumber = isset($parts[2]) ? (int) $parts[2] : 0;
            $nextNumber = $lastNumber + 1;
        }

        return $prefix . '-' . $schemeCode . '-' . str_pad((string) $nextNumber, 2, '0', STR_PAD_LEFT);
    }

    public static function makeSchemeCode(?string $schemeName = null): string
    {
        if (!$schemeName) {
            return 'DP';
        }

        $clean = preg_replace('/[^A-Za-z0-9 ]/', ' ', $schemeName);
        $clean = preg_replace('/\s+/', ' ', trim($clean));

        if ($clean === '') {
            return 'DP';
        }

        $words = array_values(array_filter(explode(' ', strtoupper($clean))));

        if (count($words) >= 2) {
            return substr($words[0], 0, 1) . substr($words[1], 0, 1);
        }

        if (strlen($words[0]) >= 2) {
            return substr($words[0], 0, 2);
        }

        return str_pad($words[0], 2, 'X');
    }
}