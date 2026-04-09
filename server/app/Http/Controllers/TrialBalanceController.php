<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\TrialBalance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TrialBalanceController extends Controller
{
    public function getTrialBalance(Request $request)
{
    $validator = Validator::make($request->all(), [
        'financial_year' => 'nullable|string|max:20',
    ]);

    if ($validator->fails()) {
        return ApiResponse::error(
            'Validation failed',
            $validator->errors(),
            422
        );
    }

    try {
        $financialYear = $request->input('financial_year');

        if (empty($financialYear)) {
            $today = Carbon::now();
            $currentMonth = (int) $today->format('n');
            $currentYear = (int) $today->format('Y');

            if ($currentMonth >= 4) {
                $financialYearStart = $currentYear;
                $financialYearEnd = $currentYear + 1;
            } else {
                $financialYearStart = $currentYear - 1;
                $financialYearEnd = $currentYear;
            }

            $financialYear = $financialYearStart . '-' . substr((string) $financialYearEnd, -2);
        }

        $makeSummaryRow = function (string $title, float $debit, float $credit, string $type): array {
            return [
                'title' => $title,
                'debit' => (float) $debit,
                'credit' => (float) $credit,
                'value' => (float) ($credit > 0 ? $credit : $debit),
                'type' => $type,
            ];
        };

        $normalizeTitleKey = function (?string $title): string {
            return strtolower(preg_replace('/\s+/', ' ', trim((string) $title)));
        };

        $getEntryAmount = function (array $item): float {
            return (float) $this->toFloatAmount(
                $item['amount']
                ?? $item['emi amount']
                ?? $item['emi_amount']
                ?? 0
            );
        };

        $normalizeMode = function ($mode): string {
            $value = strtolower(trim((string) $mode));
            $value = str_replace('_', ' ', $value);
            $value = preg_replace('/\s+/', ' ', $value);
            return trim($value);
        };

        $parseEntryDate = function ($date) {
            $raw = trim((string) $date);

            if ($raw === '') {
                return null;
            }

            try {
                return Carbon::createFromFormat('d-m-Y', $raw)->startOfDay();
            } catch (\Throwable $e) {
            }

            try {
                return Carbon::createFromFormat('Y-m-d', $raw)->startOfDay();
            } catch (\Throwable $e) {
            }

            try {
                return Carbon::parse($raw)->startOfDay();
            } catch (\Throwable $e) {
            }

            return null;
        };

        $aggregateEntriesByTitle = function (array $items, string $fallbackTitle) use ($normalizeTitleKey, $getEntryAmount): array {
            $grouped = [];

            foreach ($items as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $title = trim((string) ($item['title'] ?? ''));
                if ($title === '') {
                    $title = $fallbackTitle;
                }

                $key = $normalizeTitleKey($title);
                $amount = $getEntryAmount($item);

                if (!isset($grouped[$key])) {
                    $grouped[$key] = [
                        'title' => $title,
                        'amount' => 0.0,
                    ];
                }

                $grouped[$key]['amount'] += $amount;
            }

            $rows = array_values($grouped);

            usort($rows, function ($a, $b) {
                return strcmp((string) ($a['title'] ?? ''), (string) ($b['title'] ?? ''));
            });

            return $rows;
        };

        $trialBalances = TrialBalance::where('financial_year', $financialYear)
            ->orderByDesc('id')
            ->get();

        if ($trialBalances->isEmpty()) {
            return ApiResponse::success(
                'Trial balance fetched successfully',
                [
                    'financial_year' => $financialYear,
                    'summary' => [
                        $makeSummaryRow('Opening Balance', 0, 0, 'opening_balance'),
                        $makeSummaryRow('Cash in Hand', 0, 0, 'cash_in_hand'),
                        $makeSummaryRow('Bank Balance', 0, 0, 'bank_balance'),
                        $makeSummaryRow('Closing Balance', 0, 0, 'closing_balance'),
                        $makeSummaryRow('Debit Total', 0, 0, 'debit_total'),
                        $makeSummaryRow('Credit Total', 0, 0, 'credit_total'),
                        $makeSummaryRow('Principal Amount Total', 0, 0, 'principal_total'),
                        $makeSummaryRow('Loan Interest', 0, 0, 'interest_total'),
                        $makeSummaryRow('Difference', 0, 0, 'difference'),
                        $makeSummaryRow('Total', 0, 0, 'total'),
                    ],
                    'opening_balance' => 0.0,
                    'cash_in_hand' => 0.0,
                    'bank_balance' => 0.0,
                    'closing_balance' => 0.0,
                    'debit_total' => 0.0,
                    'credit_total' => 0.0,
                    'principal_amount_total' => 0.0,
                    'interest_amount_total' => 0.0,
                    'difference' => 0.0,
                ]
            );
        }

        foreach ($trialBalances as $trialBalanceRecord) {
            $trialBalanceModel = TrialBalance::find($trialBalanceRecord->id);

            if ($trialBalanceModel) {
                $this->calculateAndStoreBankBalance($trialBalanceModel);
            }
        }

        $trialBalances = TrialBalance::where('financial_year', $financialYear)
            ->orderByDesc('id')
            ->get();

        $openingBalance = 0.0;
        $cashInHand = 0.0;
        $bankBalance = 0.0;
        $closingBalance = 0.0;
        $allDebitJson = [];
        $allCreditJson = [];

        foreach ($trialBalances as $trialBalance) {
            $bankBalance += $this->toFloatAmount($trialBalance->bank_balance ?? 0);

            $debitJson = $this->normalizeJsonArray($trialBalance->debit_json);
            $creditJson = $this->normalizeJsonArray($trialBalance->credit_json);

            foreach ($debitJson as $item) {
                if (is_array($item)) {
                    $allDebitJson[] = $item;
                }
            }

            foreach ($creditJson as $item) {
                if (is_array($item)) {
                    $allCreditJson[] = $item;
                }
            }
        }

        $aggregatedDebitRows = $aggregateEntriesByTitle($allDebitJson, 'Untitled Debit');
        $aggregatedCreditRows = $aggregateEntriesByTitle($allCreditJson, 'Untitled Credit');

        $debitTotal = 0.0;
        foreach ($aggregatedDebitRows as $item) {
            $debitTotal += (float) ($item['amount'] ?? 0);
        }

        $creditTotal = 0.0;
        $principalAmountTotal = 0.0;
        $interestAmountTotal = 0.0;

        foreach ($allCreditJson as $item) {
            if (!is_array($item)) {
                continue;
            }

            $creditTotal += $getEntryAmount($item);
            $principalAmountTotal += $this->toFloatAmount(
                $item['principal amount']
                ?? $item['principal_amount']
                ?? 0
            );
            $interestAmountTotal += $this->toFloatAmount(
                $item['interest amount']
                ?? $item['interest_amount']
                ?? 0
            );

            $mode = $normalizeMode($item['mode'] ?? $item['payment_mode'] ?? '');
            if (str_contains($mode, 'cash')) {
                $cashInHand += $getEntryAmount($item);
            }
        }

        $sortedCreditEntries = array_values(array_filter($allCreditJson, function ($item) {
            return is_array($item);
        }));

        usort($sortedCreditEntries, function ($a, $b) use ($parseEntryDate) {
            $dateA = $parseEntryDate($a['date'] ?? null);
            $dateB = $parseEntryDate($b['date'] ?? null);

            if ($dateA && $dateB) {
                return $dateA->timestamp <=> $dateB->timestamp;
            }

            if ($dateA && !$dateB) {
                return -1;
            }

            if (!$dateA && $dateB) {
                return 1;
            }

            return 0;
        });

        if (!empty($sortedCreditEntries)) {
            $openingBalance = $getEntryAmount($sortedCreditEntries[0]);
        }

        $closingBalance = (float) ($creditTotal - $debitTotal);
        $difference = (float) $closingBalance;

        $summary = [];

        $summary[] = $makeSummaryRow('Opening Balance', 0, (float) $openingBalance, 'opening_balance');
        $summary[] = $makeSummaryRow('Cash in Hand', 0, (float) $cashInHand, 'cash_in_hand');
        $summary[] = $makeSummaryRow('Bank Balance', 0, (float) $bankBalance, 'bank_balance');
        $summary[] = $makeSummaryRow('Closing Balance', 0, (float) $closingBalance, 'closing_balance');

        foreach ($aggregatedDebitRows as $item) {
            $summary[] = $makeSummaryRow(
                (string) ($item['title'] ?? 'Untitled Debit'),
                (float) ($item['amount'] ?? 0),
                0,
                'debit'
            );
        }

        foreach ($aggregatedCreditRows as $item) {
            $summary[] = $makeSummaryRow(
                (string) ($item['title'] ?? 'Untitled Credit'),
                0,
                (float) ($item['amount'] ?? 0),
                'credit'
            );
        }

        $summary[] = $makeSummaryRow('Principal Amount Total', 0, (float) $principalAmountTotal, 'principal_total');
        $summary[] = $makeSummaryRow('Loan Interest', 0, (float) $interestAmountTotal, 'interest_total');
        $summary[] = $makeSummaryRow('Debit Total', (float) $debitTotal, 0, 'debit_total');
        $summary[] = $makeSummaryRow('Credit Total', 0, (float) $creditTotal, 'credit_total');
        $summary[] = $makeSummaryRow('Difference', 0, (float) $difference, 'difference');
        $summary[] = $makeSummaryRow('Total', (float) $debitTotal, (float) $creditTotal, 'total');

        return ApiResponse::success(
            'Trial balance fetched successfully',
            [
                'financial_year' => $financialYear,
                'summary' => $summary,
                'opening_balance' => (float) $openingBalance,
                'cash_in_hand' => (float) $cashInHand,
                'bank_balance' => (float) $bankBalance,
                'closing_balance' => (float) $closingBalance,
                'debit_total' => (float) $debitTotal,
                'credit_total' => (float) $creditTotal,
                'principal_amount_total' => (float) $principalAmountTotal,
                'interest_amount_total' => (float) $interestAmountTotal,
                'difference' => (float) $difference,
            ]
        );
    } catch (\Throwable $e) {
        return ApiResponse::error(
            'Failed to fetch trial balance',
            ['error' => $e->getMessage()],
            500
        );
    }
}

    private function calculateAndStoreBankBalance($trialBalance): void
    {
        if (!$trialBalance instanceof TrialBalance) {
            return;
        }

        $creditJson = $this->normalizeJsonArray($trialBalance->credit_json);
        $debitJson = $this->normalizeJsonArray($trialBalance->debit_json);

        $creditTotal = '0.00';
        foreach ($creditJson as $item) {
            if (!is_array($item)) {
                continue;
            }

            $creditTotal = bcadd(
                $creditTotal,
                $this->toDecimalString($item['amount'] ?? 0),
                2
            );
        }

        $debitTotal = '0.00';
        foreach ($debitJson as $item) {
            if (!is_array($item)) {
                continue;
            }

            $debitTotal = bcadd(
                $debitTotal,
                $this->toDecimalString($item['amount'] ?? 0),
                2
            );
        }

        $bankBalance = bcsub($creditTotal, $debitTotal, 2);

        $bankBalance = bcsub($creditTotal, $debitTotal, 2);

        if ((string) ($trialBalance->bank_balance ?? '0.00') !== $bankBalance) {
            $trialBalance->setAttribute('bank_balance', $bankBalance);
            $trialBalance->save();
        }
    }

    private function normalizeJsonArray($value): array
    {
        if (is_array($value)) {
            return array_values(array_filter($value, function ($item) {
                return is_array($item);
            }));
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);

            if (is_array($decoded)) {
                return array_values(array_filter($decoded, function ($item) {
                    return is_array($item);
                }));
            }
        }

        return [];
    }

    private function toDecimalString($amount): string
    {
        if (is_string($amount)) {
            $amount = preg_replace('/[^0-9.\-]/', '', $amount);
        }

        if (!is_numeric($amount)) {
            return '0.00';
        }

        return number_format((float) $amount, 2, '.', '');
    }

    private function toFloatAmount($amount): float
    {
        if (is_string($amount)) {
            $amount = preg_replace('/[^0-9.\-]/', '', $amount);
        }

        return is_numeric($amount) ? (float) $amount : 0.0;
    }
}