<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanApplication extends Model
{
    use HasFactory;

    protected $table = 'loan_applications';

    protected $fillable = [
        'application_no',
        'application_status',
        'member_id',
        'member_name',
        'member_email',
        'scheme_id',
        'scheme_name',
        'interest_rate',
        'loan_amount',
        'tenure_months',
        'tenure_years',
        'dependents',
        'loan_purpose',
        'monthly_income_amount',
        'annual_family_income',
        'source',
        'source_details',
        'exiting_loans',
        'guarantor_1_id',
        'guarantor_1_name',
        'guarantor_1_status',
        'guarantor_1_reason',
        'updated_by_guarantor_1',
        'guarantor_2_id',
        'guarantor_2_name',
        'guarantor_2_status',
        'guarantor_2_reason',
        'updated_by_guarantor_2',
        'bank_name_and_branch',
        'bank_account_number',
        'ifsc_code',
        'adhaar_number',
        'i_agree',
        'start_date',
        'end_date',
        'is_active',
        'sanctioned_amount',
        'is_loan_adjusted',
        'adjustment_remark',
        'admin_approval_status',
        'admin_approved_by',
        'admin_approved_at',
        'sanchalak_response',
        'sanchalak_approvals_status',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'interest_rate' => 'decimal:2',
        'loan_amount' => 'decimal:2',
        'monthly_income_amount' => 'decimal:2',
        'annual_family_income' => 'decimal:2',
        'sanctioned_amount' => 'decimal:2',
        'i_agree' => 'boolean',
        'is_active' => 'boolean',
        'is_loan_adjusted' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
        'admin_approved_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public $timestamps = false;

    public function scheme()
    {
        return $this->belongsTo(LoanScheme::class, 'scheme_id');
    }

    public static function generateApplicationNo(string $memberId): string
    {
        $prefix = $memberId . '-LN-';

        $lastApplication = self::where('application_no', 'like', $prefix . '%')
            ->orderByRaw('CAST(SUBSTRING_INDEX(application_no, "-", -1) AS UNSIGNED) DESC')
            ->first();

        $nextNumber = 1;

        if ($lastApplication) {
            $lastSerial = (int) substr($lastApplication->application_no, strrpos($lastApplication->application_no, '-') + 1);
            $nextNumber = $lastSerial + 1;
        }

        return $prefix . str_pad((string) $nextNumber, 2, '0', STR_PAD_LEFT);
    }
}