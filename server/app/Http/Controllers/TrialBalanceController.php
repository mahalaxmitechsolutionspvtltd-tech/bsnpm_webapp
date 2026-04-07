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

            $trialBalances = TrialBalance::where('financial_year', $financialYear)
                ->orderByDesc('id')
                ->get();

            if ($trialBalances->isEmpty()) {
                return ApiResponse::success(
                    'Trial balance fetched successfully',
                    [
                        'financial_year' => $financialYear,
                        'opening_balance' => 0,
                        'cash_in_hand' => 0,
                        'bank_balance' => 0,
                        'closing_balance' => 0,
                        'debit_json' => [],
                        'credit_json' => [],
                        'debit_total' => 0,
                        'credit_total' => 0,
                        'difference' => 0,
                        'rows' => [],
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
                $openingBalance += $this->toFloatAmount($trialBalance->opening_balance ?? 0);
                $cashInHand += $this->toFloatAmount($trialBalance->cash_in_hand ?? 0);
                $bankBalance += $this->toFloatAmount($trialBalance->bank_balance ?? 0);
                $closingBalance += $this->toFloatAmount($trialBalance->closing_balance ?? 0);

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

            $groupedDebitJson = [];
            foreach ($allDebitJson as $item) {
                $title = trim((string) ($item['title'] ?? ''));
                $applicationNo = trim((string) ($item['application_no'] ?? ''));
                $date = trim((string) ($item['date'] ?? ''));
                $mode = trim((string) ($item['mode'] ?? ''));
                $createdBy = trim((string) ($item['created_by'] ?? ''));
                $amount = $this->toFloatAmount($item['amount'] ?? 0);

                $groupKey = implode('|', [
                    $title,
                    $applicationNo,
                    $date,
                    $mode,
                    $createdBy,
                ]);

                if (!isset($groupedDebitJson[$groupKey])) {
                    $groupedDebitJson[$groupKey] = [
                        'id' => count($groupedDebitJson) + 1,
                        'title' => $title,
                        'application_no' => $applicationNo,
                        'date' => $date,
                        'amount' => 0.0,
                        'mode' => $mode,
                        'created_by' => $createdBy,
                    ];
                }

                $groupedDebitJson[$groupKey]['amount'] += $amount;
            }

            $groupedCreditJson = [];
            foreach ($allCreditJson as $item) {
                $title = trim((string) ($item['title'] ?? ''));
                $applicationNo = trim((string) ($item['application_no'] ?? ''));
                $date = trim((string) ($item['date'] ?? ''));
                $mode = trim((string) ($item['mode'] ?? ''));
                $createdBy = trim((string) ($item['created_by'] ?? ''));
                $amount = $this->toFloatAmount($item['amount'] ?? 0);

                $groupKey = implode('|', [
                    $title,
                    $applicationNo,
                    $date,
                    $mode,
                    $createdBy,
                ]);

                if (!isset($groupedCreditJson[$groupKey])) {
                    $groupedCreditJson[$groupKey] = [
                        'id' => count($groupedCreditJson) + 1,
                        'title' => $title,
                        'application_no' => $applicationNo,
                        'date' => $date,
                        'amount' => 0.0,
                        'mode' => $mode,
                        'created_by' => $createdBy,
                    ];
                }

                $groupedCreditJson[$groupKey]['amount'] += $amount;
            }

            $finalDebitJson = array_values($groupedDebitJson);
            $finalCreditJson = array_values($groupedCreditJson);

            usort($finalDebitJson, function ($a, $b) {
                return strcmp((string) ($a['date'] ?? ''), (string) ($b['date'] ?? ''));
            });

            usort($finalCreditJson, function ($a, $b) {
                return strcmp((string) ($a['date'] ?? ''), (string) ($b['date'] ?? ''));
            });

            $debitTotal = 0.0;
            foreach ($finalDebitJson as $item) {
                $debitTotal += $this->toFloatAmount($item['amount'] ?? 0);
            }

            $creditTotal = 0.0;
            foreach ($finalCreditJson as $item) {
                $creditTotal += $this->toFloatAmount($item['amount'] ?? 0);
            }

            $rows = [];

            $rows[] = [
                'title' => 'Opening Balance',
                'debit' => null,
                'credit' => (float) $openingBalance,
                'type' => 'opening_balance',
            ];

            foreach ($finalCreditJson as $item) {
                $rows[] = [
                    'title' => (string) ($item['title'] ?? ''),
                    'application_no' => (string) ($item['application_no'] ?? ''),
                    'date' => (string) ($item['date'] ?? ''),
                    'amount' => $this->toFloatAmount($item['amount'] ?? 0),
                    'mode' => (string) ($item['mode'] ?? ''),
                    'created_by' => (string) ($item['created_by'] ?? ''),
                    'debit' => null,
                    'credit' => $this->toFloatAmount($item['amount'] ?? 0),
                    'type' => 'credit',
                ];
            }

            foreach ($finalDebitJson as $item) {
                $rows[] = [
                    'title' => (string) ($item['title'] ?? ''),
                    'application_no' => (string) ($item['application_no'] ?? ''),
                    'date' => (string) ($item['date'] ?? ''),
                    'amount' => $this->toFloatAmount($item['amount'] ?? 0),
                    'mode' => (string) ($item['mode'] ?? ''),
                    'created_by' => (string) ($item['created_by'] ?? ''),
                    'debit' => $this->toFloatAmount($item['amount'] ?? 0),
                    'credit' => null,
                    'type' => 'debit',
                ];
            }

            $rows[] = [
                'title' => 'Closing Balance',
                'debit' => null,
                'credit' => (float) $closingBalance,
                'type' => 'closing_balance',
            ];

            $rows[] = [
                'title' => 'Cash in Hand',
                'debit' => null,
                'credit' => (float) $cashInHand,
                'type' => 'cash_in_hand',
            ];

            $rows[] = [
                'title' => 'Bank Balance',
                'debit' => null,
                'credit' => (float) $bankBalance,
                'type' => 'bank_balance',
            ];

            $rows[] = [
                'title' => 'Total',
                'debit' => (float) $debitTotal,
                'credit' => (float) $creditTotal,
                'type' => 'total',
            ];

            return ApiResponse::success(
                'Trial balance fetched successfully',
                [
                    'financial_year' => $financialYear,
                    'opening_balance' => (float) $openingBalance,
                    'cash_in_hand' => (float) $cashInHand,
                    'bank_balance' => (float) $bankBalance,
                    'closing_balance' => (float) $closingBalance,
                    'debit_json' => $finalDebitJson,
                    'credit_json' => $finalCreditJson,
                    'debit_total' => (float) $debitTotal,
                    'credit_total' => (float) $creditTotal,
                    'difference' => (float) ($creditTotal - $debitTotal),
                    'rows' => $rows,
                    'raw' => $trialBalances,
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