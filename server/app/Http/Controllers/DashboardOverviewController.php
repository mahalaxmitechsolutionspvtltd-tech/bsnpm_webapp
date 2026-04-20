<?php

namespace App\Http\Controllers;

use App\Models\DepositApplication;
use App\Models\LoanApplication;
use App\Models\LoanApplicationDeduction;
use App\Models\LoanEmi;
use App\Models\Member;
use App\Models\MemberEmergencyFund;
use App\Models\MembersJoiningFee;
use App\Models\MemberShareCapital;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DashboardOverviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        [$rangeStart, $rangeEnd, $appliedMonth, $appliedFinancialYear] = $this->resolveDateRange(
            $request->input('financial_year'),
            $request->input('month'),
            $request->input('year')
        );

        $totalMembers = $this->sumOrCountMembers($rangeStart, $rangeEnd);
        $totalMemberJoiningFee = $this->sumJoiningFee($rangeStart, $rangeEnd);
        $totalLoanAmount = $this->sumLoanAmount($rangeStart, $rangeEnd);
        $totalLoanOutstanding = $this->sumLoanOutstanding($rangeStart, $rangeEnd);
        $totalShareCapital = $this->sumShareCapital($rangeStart, $rangeEnd);
        $totalEmergencyFund = $this->sumEmergencyFund($rangeStart, $rangeEnd);
        $totalKayamThev = $this->sumKayamThev($rangeStart, $rangeEnd);
        $totalActiveLoans = $this->countActiveLoans($rangeStart, $rangeEnd);

        $schemeKeys = [
            'Recurring Deposit',
            'Lakhpati Yojna (3Y)',
            'Lakhpati Yojna (5Y)',
            'Term Deposit (1–3Y)',
            'Term Deposit (5–10Y)',
            'Damduppat',
            'Fixed Deposit',
        ];

        $schemeTotals = $this->sumDepositSchemes($rangeStart, $rangeEnd, $schemeKeys);
        $totalDepositsSchemes = collect($schemeTotals)->sum(fn ($value) => (float) $value);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard overview fetched successfully',
            'data' => [
                'filters' => [
                    'financial_year' => $appliedFinancialYear,
                    'month' => $appliedMonth,
                    'range_start' => $rangeStart?->toDateString(),
                    'range_end' => $rangeEnd?->toDateString(),
                ],
                'kpis' => [
                    'total_members' => [
                        'count' => $totalMembers,
                    ],
                    'total_member_joining_fee' => [
                        'amount' => $this->toAmount($totalMemberJoiningFee),
                    ],
                    'total_loan_amount' => [
                        'amount' => $this->toAmount($totalLoanAmount),
                    ],
                    'total_loan_outstanding' => [
                        'amount' => $this->toAmount($totalLoanOutstanding),
                    ],
                    'total_share_capital' => [
                        'amount' => $this->toAmount($totalShareCapital),
                    ],
                    'total_emergency_fund' => [
                        'amount' => $this->toAmount($totalEmergencyFund),
                    ],
                    'total_kayam_thev' => [
                        'amount' => $this->toAmount($totalKayamThev),
                    ],
                    'total_active_loans' => [
                        'count' => $totalActiveLoans,
                    ],
                ],
                'deposit_schemes' => [
                    'recurring_deposit' => [
                        'scheme_name' => 'Recurring Deposit',
                        'amount' => $this->toAmount($schemeTotals['Recurring Deposit'] ?? 0),
                    ],
                    'lakhpati_yojna_3y' => [
                        'scheme_name' => 'Lakhpati Yojna (3Y)',
                        'amount' => $this->toAmount($schemeTotals['Lakhpati Yojna (3Y)'] ?? 0),
                    ],
                    'lakhpati_yojna_5y' => [
                        'scheme_name' => 'Lakhpati Yojna (5Y)',
                        'amount' => $this->toAmount($schemeTotals['Lakhpati Yojna (5Y)'] ?? 0),
                    ],
                    'term_deposit_1_3y' => [
                        'scheme_name' => 'Term Deposit (1–3Y)',
                        'amount' => $this->toAmount($schemeTotals['Term Deposit (1–3Y)'] ?? 0),
                    ],
                    'term_deposit_5_10y' => [
                        'scheme_name' => 'Term Deposit (5–10Y)',
                        'amount' => $this->toAmount($schemeTotals['Term Deposit (5–10Y)'] ?? 0),
                    ],
                    'damduppat' => [
                        'scheme_name' => 'Damduppat',
                        'amount' => $this->toAmount($schemeTotals['Damduppat'] ?? 0),
                    ],
                    'fixed_deposit' => [
                        'scheme_name' => 'Fixed Deposit',
                        'amount' => $this->toAmount($schemeTotals['Fixed Deposit'] ?? 0),
                    ],
                    'total_deposits_schemes' => [
                        'amount' => $this->toAmount($totalDepositsSchemes),
                    ],
                ],
            ],
        ]);
    }

    protected function resolveDateRange(
        ?string $financialYear,
        mixed $month,
        mixed $year
    ): array {
        $financialYear = is_string($financialYear) ? trim($financialYear) : null;
        $month = $month !== null && $month !== '' ? (int) $month : null;
        $year = $year !== null && $year !== '' ? (int) $year : null;

        if ($financialYear && preg_match('/^(\d{4})\s*-\s*(\d{2}|\d{4})$/', $financialYear, $matches)) {
            $startYear = (int) $matches[1];
            $endYearRaw = $matches[2];
            $endYear = strlen($endYearRaw) === 2
                ? (int) (substr((string) $startYear, 0, 2) . $endYearRaw)
                : (int) $endYearRaw;

            $fyStart = Carbon::create($startYear, 4, 1)->startOfDay();
            $fyEnd = Carbon::create($endYear, 3, 31)->endOfDay();

            if ($month && $month >= 1 && $month <= 12) {
                $targetYear = $month >= 4 ? $startYear : $endYear;
                $monthStart = Carbon::create($targetYear, $month, 1)->startOfMonth()->startOfDay();
                $monthEnd = Carbon::create($targetYear, $month, 1)->endOfMonth()->endOfDay();

                if ($monthStart->betweenIncluded($fyStart, $fyEnd) && $monthEnd->betweenIncluded($fyStart, $fyEnd)) {
                    return [$monthStart, $monthEnd, $month, $financialYear];
                }
            }

            return [$fyStart, $fyEnd, $month, $financialYear];
        }

        if ($year && $month && $month >= 1 && $month <= 12) {
            $start = Carbon::create($year, $month, 1)->startOfMonth()->startOfDay();
            $end = Carbon::create($year, $month, 1)->endOfMonth()->endOfDay();

            return [$start, $end, $month, (string) $year];
        }

        if ($year) {
            $start = Carbon::create($year, 1, 1)->startOfYear()->startOfDay();
            $end = Carbon::create($year, 12, 31)->endOfYear()->endOfDay();

            return [$start, $end, $month, (string) $year];
        }

        return [null, null, $month, $financialYear];
    }

    protected function sumOrCountMembers(?Carbon $start, ?Carbon $end): int
    {
        $query = Member::query();

        if ($this->hasColumn(Member::class, 'is_deleted')) {
            $query->where(function ($q) {
                $q->where('is_deleted', 0)->orWhereNull('is_deleted');
            });
        }

        if ($this->hasColumn(Member::class, 'status')) {
            $query->where(function ($q) {
                $q->where('status', 'active')
                    ->orWhere('status', 'ACTIVE')
                    ->orWhereNull('status');
            });
        }

        if ($this->hasColumn(Member::class, 'created_at')) {
            $this->applyBetween($query, 'created_at', $start, $end);
        }

        return (int) $query->count();
    }

    protected function sumJoiningFee(?Carbon $start, ?Carbon $end): float
    {
        $query = MembersJoiningFee::query();

        if ($this->hasColumn(MembersJoiningFee::class, 'last_payment_date')) {
            $this->applyBetween($query, 'last_payment_date', $start, $end);
        }

        return (float) ($query->sum('joining_fee_amount') ?? 0);
    }

    protected function sumShareCapital(?Carbon $start, ?Carbon $end): float
    {
        $query = MemberShareCapital::query();

        if ($this->hasColumn(MemberShareCapital::class, 'last_payment_date')) {
            $this->applyBetween($query, 'last_payment_date', $start, $end);
        }

        return (float) ($query->sum('share_capital_amount') ?? 0);
    }

    protected function sumEmergencyFund(?Carbon $start, ?Carbon $end): float
    {
        $query = MemberEmergencyFund::query();

        if ($this->hasColumn(MemberEmergencyFund::class, 'last_payment_date')) {
            $this->applyBetween($query, 'last_payment_date', $start, $end);
        }

        return (float) ($query->sum('emergency_fund_amount') ?? 0);
    }

    protected function sumKayamThev(?Carbon $start, ?Carbon $end): float
    {
        $query = LoanApplicationDeduction::query();

        if ($this->hasColumn(LoanApplicationDeduction::class, 'applied_date')) {
            $this->applyBetween($query, 'applied_date', $start, $end);
        } elseif ($this->hasColumn(LoanApplicationDeduction::class, 'start_date')) {
            $this->applyBetween($query, 'start_date', $start, $end);
        }

        return (float) ($query->sum('kayam_thev_amount') ?? 0);
    }

    protected function sumLoanAmount(?Carbon $start, ?Carbon $end): float
    {
        $query = LoanApplication::query();

        if ($this->hasColumn(LoanApplication::class, 'application_status')) {
            $query->whereNotIn('application_status', ['rejected', 'REJECTED', 'cancelled', 'CANCELLED']);
        }

        if ($this->hasColumn(LoanApplication::class, 'is_active')) {
            $query->where(function ($q) {
                $q->where('is_active', 1)->orWhereNull('is_active');
            });
        }

        if ($this->hasColumn(LoanApplication::class, 'start_date')) {
            $this->applyBetween($query, 'start_date', $start, $end);
        } elseif ($this->hasColumn(LoanApplication::class, 'created_at')) {
            $this->applyBetween($query, 'created_at', $start, $end);
        }

        $sanctioned = $this->hasColumn(LoanApplication::class, 'sanctioned_amount')
            ? (float) ($query->sum('sanctioned_amount') ?? 0)
            : 0.0;

        if ($sanctioned > 0) {
            return $sanctioned;
        }

        return (float) ($query->sum('loan_amount') ?? 0);
    }

    protected function countActiveLoans(?Carbon $start, ?Carbon $end): int
    {
        $query = LoanApplication::query();

        if ($this->hasColumn(LoanApplication::class, 'application_status')) {
            $query->whereNotIn('application_status', ['rejected', 'REJECTED', 'closed', 'CLOSED', 'cancelled', 'CANCELLED']);
        }

        if ($this->hasColumn(LoanApplication::class, 'is_active')) {
            $query->where('is_active', 1);
        }

        if ($this->hasColumn(LoanApplication::class, 'is_loan_adjusted')) {
            $query->where(function ($q) {
                $q->where('is_loan_adjusted', 0)->orWhereNull('is_loan_adjusted');
            });
        }

        if ($this->hasColumn(LoanApplication::class, 'start_date')) {
            $this->applyBetween($query, 'start_date', $start, $end);
        } elseif ($this->hasColumn(LoanApplication::class, 'created_at')) {
            $this->applyBetween($query, 'created_at', $start, $end);
        }

        return (int) $query->count();
    }

    protected function sumLoanOutstanding(?Carbon $start, ?Carbon $end): float
    {
        $loanEmis = LoanEmi::query()
            ->when(
                $this->hasColumn(LoanEmi::class, 'start_date'),
                fn ($query) => $this->applyBetween($query, 'start_date', $start, $end)
            )
            ->get(['application_no', 'emi_schedule']);

        $total = 0.0;

        foreach ($loanEmis as $loanEmi) {
            $schedule = is_array($loanEmi->emi_schedule) ? $loanEmi->emi_schedule : [];
            $total += $this->extractOutstandingAmount($schedule);
        }

        return $total;
    }

    protected function extractOutstandingAmount(array $schedule): float
    {
        if (empty($schedule)) {
            return 0.0;
        }

        $pendingRows = collect($schedule)
            ->filter(function ($row) {
                $status = strtolower(trim((string) ($row['status'] ?? '')));

                return !in_array($status, ['paid', 'completed', 'closed'], true);
            })
            ->values();

        $targetRows = $pendingRows->isNotEmpty() ? $pendingRows : collect($schedule);
        $lastRow = $targetRows->last();

        if (is_array($lastRow) && array_key_exists('outstanding balance', $lastRow)) {
            return (float) $lastRow['outstanding balance'];
        }

        if (is_array($lastRow) && array_key_exists('outstanding_balance', $lastRow)) {
            return (float) $lastRow['outstanding_balance'];
        }

        if (is_array($lastRow) && array_key_exists('emi amount', $lastRow)) {
            return (float) $targetRows->sum(fn ($row) => (float) ($row['emi amount'] ?? 0));
        }

        if (is_array($lastRow) && array_key_exists('emi_amount', $lastRow)) {
            return (float) $targetRows->sum(fn ($row) => (float) ($row['emi_amount'] ?? 0));
        }

        return 0.0;
    }

    protected function sumDepositSchemes(?Carbon $start, ?Carbon $end, array $targetSchemes): array
    {
        $query = DepositApplication::query();

        if ($this->hasColumn(DepositApplication::class, 'status')) {
            $query->whereNotIn('status', ['rejected', 'REJECTED', 'withdrawn', 'WITHDRAWN', 'closed', 'CLOSED']);
        }

        if ($this->hasColumn(DepositApplication::class, 'is_active')) {
            $query->where(function ($q) {
                $q->where('is_active', 1)->orWhereNull('is_active');
            });
        }

        if ($this->hasColumn(DepositApplication::class, 'is_withdrawal')) {
            $query->where(function ($q) {
                $q->where('is_withdrawal', 0)->orWhereNull('is_withdrawal');
            });
        }

        if ($this->hasColumn(DepositApplication::class, 'start_date')) {
            $this->applyBetween($query, 'start_date', $start, $end);
        } elseif ($this->hasColumn(DepositApplication::class, 'created_at')) {
            $this->applyBetween($query, 'created_at', $start, $end);
        }

        $applications = $query->get(['scheme_name', 'deposit_amount']);
        $normalizedTotals = [];

        foreach ($targetSchemes as $schemeName) {
            $normalizedTotals[$schemeName] = 0.0;
        }

        foreach ($applications as $application) {
            $matchedKey = $this->matchSchemeKey((string) $application->scheme_name, $targetSchemes);

            if ($matchedKey === null) {
                continue;
            }

            $normalizedTotals[$matchedKey] += (float) $application->deposit_amount;
        }

        return $normalizedTotals;
    }

    protected function matchSchemeKey(string $inputSchemeName, array $targetSchemes): ?string
    {
        $normalizedInput = $this->normalizeSchemeName($inputSchemeName);

        foreach ($targetSchemes as $scheme) {
            if ($this->normalizeSchemeName($scheme) === $normalizedInput) {
                return $scheme;
            }
        }

        if (str_contains($normalizedInput, 'recurring') || $normalizedInput === 'rd') {
            return 'Recurring Deposit';
        }

        if (str_contains($normalizedInput, 'lakhpati') && str_contains($normalizedInput, '3')) {
            return 'Lakhpati Yojna (3Y)';
        }

        if (str_contains($normalizedInput, 'lakhpati') && str_contains($normalizedInput, '5')) {
            return 'Lakhpati Yojna (5Y)';
        }

        if (str_contains($normalizedInput, 'term') && str_contains($normalizedInput, '1') && str_contains($normalizedInput, '3')) {
            return 'Term Deposit (1–3Y)';
        }

        if (str_contains($normalizedInput, 'term') && str_contains($normalizedInput, '5') && str_contains($normalizedInput, '10')) {
            return 'Term Deposit (5–10Y)';
        }

        if (str_contains($normalizedInput, 'damduppat') || str_contains($normalizedInput, 'damdupat')) {
            return 'Damduppat';
        }

        if (str_contains($normalizedInput, 'fixed')) {
            return 'Fixed Deposit';
        }

        return null;
    }

    protected function normalizeSchemeName(string $value): string
    {
        $value = mb_strtolower($value);
        $value = str_replace(['–', '—'], '-', $value);
        $value = preg_replace('/[^a-z0-9]+/u', ' ', $value) ?? '';
        $value = preg_replace('/\s+/u', ' ', trim($value)) ?? '';

        return $value;
    }

    protected function applyBetween($query, string $column, ?Carbon $start, ?Carbon $end)
    {
        if (!$start || !$end) {
            return $query;
        }

        return $query->whereBetween($column, [$start->copy()->startOfDay(), $end->copy()->endOfDay()]);
    }

    protected function hasColumn(string $modelClass, string $column): bool
    {
        $model = new $modelClass();

        return \Schema::hasColumn($model->getTable(), $column);
    }

    protected function toAmount(float $amount): float
    {
        return round($amount, 2);
    }
}