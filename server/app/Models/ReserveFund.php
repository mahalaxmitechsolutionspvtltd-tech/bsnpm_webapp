<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReserveFund extends Model
{
    protected $table = 'reserve_funds';

    protected $fillable = [
        'reserve_fund_id',
        'title',
        'category',
        'amount',
        'transaction_type',
        'payment_mode',
        'reference_no',
        'fund_date',
        'financial_year',
        'status',
        'remark',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fund_date' => 'date:Y-m-d',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
    ];

    protected $appends = [
        'formatted_amount',
        'formatted_fund_date',
        'formatted_created_at',
        'formatted_updated_at',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function (ReserveFund $reserveFund) {
            if (empty($reserveFund->reserve_fund_id)) {
                $reserveFund->reserve_fund_id = self::generateReserveFundId();
            }

            if (empty($reserveFund->financial_year) && !empty($reserveFund->fund_date)) {
                $reserveFund->financial_year = self::getFinancialYear($reserveFund->fund_date);
            }
        });

        static::updating(function (ReserveFund $reserveFund) {
            if (empty($reserveFund->financial_year) && !empty($reserveFund->fund_date)) {
                $reserveFund->financial_year = self::getFinancialYear($reserveFund->fund_date);
            }
        });
    }

    public static function generateReserveFundId(): string
    {
        $year = now()->format('Y');

        $latestReserveFund = self::where('reserve_fund_id', 'like', "RF-{$year}-%")
            ->orderByDesc('id')
            ->first();

        $nextNumber = 1;

        if ($latestReserveFund && !empty($latestReserveFund->reserve_fund_id)) {
            $parts = explode('-', $latestReserveFund->reserve_fund_id);
            $lastNumber = (int) end($parts);
            $nextNumber = $lastNumber + 1;
        }

        return 'RF-' . $year . '-' . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }

    public static function getFinancialYear(string $date): string
    {
        $timestamp = strtotime($date);
        $month = (int) date('m', $timestamp);
        $year = (int) date('Y', $timestamp);

        if ($month >= 4) {
            return $year . '-' . substr((string) ($year + 1), -2);
        }

        return ($year - 1) . '-' . substr((string) $year, -2);
    }

    public function getFormattedAmountAttribute(): string
    {
        return '₹ ' . number_format((float) $this->amount, 2);
    }

    public function getFormattedFundDateAttribute(): ?string
    {
        return $this->fund_date ? $this->fund_date->format('d M Y') : null;
    }

    public function getFormattedCreatedAtAttribute(): ?string
    {
        return $this->created_at ? $this->created_at->format('d M Y h:i A') : null;
    }

    public function getFormattedUpdatedAtAttribute(): ?string
    {
        return $this->updated_at ? $this->updated_at->format('d M Y h:i A') : null;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeFinancialYear($query, string $financialYear)
    {
        return $query->where('financial_year', $financialYear);
    }

    public function scopeTransactionType($query, string $transactionType)
    {
        return $query->where('transaction_type', $transactionType);
    }

    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeSearch($query, ?string $search)
    {
        if (!$search) {
            return $query;
        }

        return $query->where(function ($subQuery) use ($search) {
            $subQuery->where('reserve_fund_id', 'like', '%' . $search . '%')
                ->orWhere('title', 'like', '%' . $search . '%')
                ->orWhere('category', 'like', '%' . $search . '%')
                ->orWhere('reference_no', 'like', '%' . $search . '%')
                ->orWhere('financial_year', 'like', '%' . $search . '%')
                ->orWhere('created_by', 'like', '%' . $search . '%');
        });
    }
}