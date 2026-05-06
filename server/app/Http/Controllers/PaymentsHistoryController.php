<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\AccountManagement;
use App\Models\DepositInstallment;
use App\Models\LoanEmi;
use App\Models\TrialBalance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PaymentsHistoryController extends Controller
{
    public function getPaymentHistory(Request $request): JsonResponse
    {
        try {
            $page = (int) $request->query('page', 1);
            $perPage = (int) $request->query('per_page', 100);

            $page = $page > 0 ? $page : 1;
            $perPage = $perPage > 0 ? $perPage : 100;
            $perPage = min($perPage, 100);

            $accountManagementRows = AccountManagement::query()
                ->orderByDesc('id')
                ->paginate($perPage, ['*'], 'page', $page);

            $buildProofFileUrl = function ($proofFile): ?string {
                if (empty($proofFile)) {
                    return null;
                }

                $proofFile = trim((string) $proofFile);

                if ($proofFile === '') {
                    return null;
                }

                if (str_starts_with($proofFile, 'http://') || str_starts_with($proofFile, 'https://')) {
                    return $proofFile;
                }

                $proofFile = str_replace('\\', '/', $proofFile);
                $proofFile = preg_replace('#/+#', '/', $proofFile);
                $fileName = basename($proofFile);

                if (empty($fileName) || $fileName === '.' || $fileName === '..') {
                    return null;
                }

                $baseUrl = rtrim((string) env('PAYMENT_PROOF_BASE_URL', env('APP_URL')), '/');

                return $baseUrl . '/payment_proofs/' . $fileName;
            };

            $normalizeJsonArray = function ($value): array {
                if (is_array($value)) {
                    return $value;
                }

                if (is_string($value)) {
                    $decoded = json_decode($value, true);

                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        return $decoded;
                    }
                }

                return [];
            };

            $normalizeAmount = function ($value): float {
                if ($value === null || $value === '') {
                    return 0.00;
                }

                return round((float) str_replace(',', '', (string) $value), 2);
            };

            $formatAmount = function ($value) use ($normalizeAmount): string {
                return number_format($normalizeAmount($value), 2, '.', '');
            };

            $normalizeStatus = function ($value): string {
                $status = strtolower(trim((string) ($value ?? 'pending')));

                return $status === '' ? 'pending' : $status;
            };

            $getApplicationNo = function (array $applicationItem): string {
                return trim((string) (
                    $applicationItem['application no']
                    ?? $applicationItem['application_no']
                    ?? $applicationItem['app_no']
                    ?? $applicationItem['applicationNo']
                    ?? ''
                ));
            };

            $getApplicationTitle = function (array $applicationItem): string {
                return trim((string) (
                    $applicationItem['title']
                    ?? $applicationItem['detail']
                    ?? $applicationItem['name']
                    ?? $applicationItem['scheme_name']
                    ?? 'Payment'
                ));
            };

            $getApplicationMemberName = function (array $applicationItem, $fallbackName): string {
                return trim((string) (
                    $applicationItem['member name']
                    ?? $applicationItem['member_name']
                    ?? $fallbackName
                    ?? ''
                ));
            };

            $getApplicationAmount = function (array $applicationItem, $fallbackAmount) use ($normalizeAmount): float {
                return $normalizeAmount(
                    $applicationItem['amount']
                    ?? $applicationItem['paid_amount']
                    ?? $applicationItem['total_amount']
                    ?? $fallbackAmount
                );
            };

            $getApplicationTenure = function (array $applicationItem) {
                return $applicationItem['tenure'] ?? null;
            };

            $makeProofPayload = function ($accountRow) use ($buildProofFileUrl): array {
                $proofFileUrl = $buildProofFileUrl($accountRow->proof_file ?? null);
                $proofFileName = !empty($accountRow->proof_file)
                    ? basename(str_replace('\\', '/', (string) $accountRow->proof_file))
                    : null;
                $proofFileType = !empty($accountRow->proof_file)
                    ? pathinfo(str_replace('\\', '/', (string) $accountRow->proof_file), PATHINFO_EXTENSION)
                    : null;

                return [
                    'proof_file' => $proofFileUrl,
                    'proof_file_url' => $proofFileUrl,
                    'proof_file_name' => $proofFileName,
                    'proof' => [
                        'file_url' => $proofFileUrl,
                        'file_name' => $proofFileName,
                        'file_type' => $proofFileType,
                    ],
                ];
            };

            $results = [];

            foreach ($accountManagementRows->items() as $accountRow) {
                $applicationsJson = $normalizeJsonArray($accountRow->applications_json ?? null);
                $proofPayload = $makeProofPayload($accountRow);
                $accountStatus = $normalizeStatus($accountRow->status ?? 'pending');
                $rowApplicationNo = null;
                $sourceType = 'account_management';
                $amount = $normalizeAmount($accountRow->total_amount ?? $accountRow->amount ?? 0);
                $applicationDetails = [
                    'title' => 'Payment',
                    'member_name' => $accountRow->member_name,
                    'amount' => $amount,
                    'application_no' => null,
                    'tenure' => null,
                    'breakdown' => [],
                ];

                if (!empty($applicationsJson)) {
                    $matchedApplications = [];

                    foreach ($applicationsJson as $applicationItem) {
                        if (!is_array($applicationItem)) {
                            continue;
                        }

                        $matchedApplications[] = $applicationItem;
                    }

                    if (!empty($matchedApplications)) {
                        $firstApplication = $matchedApplications[0];
                        $rowApplicationNo = $getApplicationNo($firstApplication);
                        $amount = $getApplicationAmount($firstApplication, $amount);
                        $sourceType = $rowApplicationNo !== '' ? 'deposit' : 'member_fund';
                        $breakdown = [];

                        foreach ($matchedApplications as $matchedApplication) {
                            $breakdown[] = [
                                'title' => $getApplicationTitle($matchedApplication),
                                'member_name' => $getApplicationMemberName($matchedApplication, $accountRow->member_name),
                                'amount' => $getApplicationAmount($matchedApplication, 0),
                                'application_no' => $getApplicationNo($matchedApplication) ?: null,
                                'tenure' => $getApplicationTenure($matchedApplication),
                            ];
                        }

                        $applicationDetails = [
                            'title' => $getApplicationTitle($firstApplication),
                            'member_name' => $getApplicationMemberName($firstApplication, $accountRow->member_name),
                            'amount' => $amount,
                            'application_no' => $rowApplicationNo ?: null,
                            'tenure' => $getApplicationTenure($firstApplication),
                            'breakdown' => $breakdown,
                        ];
                    }
                }

                $createdAt = $accountRow->created_at ? Carbon::parse($accountRow->created_at) : null;

                $results[] = [
                    'id' => $accountRow->id,
                    'account_management_id' => $accountRow->id,
                    'member_id' => $accountRow->member_id,
                    'member_name' => $accountRow->member_name,
                    'submitted_on' => $createdAt ? $createdAt->format('Y-m-d') : null,
                    'submitted_time' => $createdAt ? $createdAt->format('H:i:s') : null,
                    'date_of_payment' => $accountRow->date_of_payment,
                    'date_paid' => $accountRow->date_of_payment,
                    'amount' => $amount,
                    'total_amount' => $formatAmount($amount),
                    'payment_mode' => $accountRow->payment_mode,
                    'proof_file' => $proofPayload['proof_file'],
                    'proof_file_url' => $proofPayload['proof_file_url'],
                    'proof_file_name' => $proofPayload['proof_file_name'],
                    'reference_trn' => $accountRow->reference_trn,
                    'remark' => $accountRow->remark,
                    'status' => $accountStatus,
                    'account_management_status' => $accountStatus,
                    'application_status' => $accountStatus,
                    'installment_status' => null,
                    'created_by' => $accountRow->created_by,
                    'created_at' => $accountRow->created_at,
                    'submitted_at' => $accountRow->created_at,
                    'application_no' => $rowApplicationNo ?: null,
                    'source_type' => $sourceType,
                    'application_details' => $applicationDetails,
                    'proof' => $proofPayload['proof'],
                    'installment' => null,
                ];
            }

            $statusCounts = [
                'all' => $accountManagementRows->total(),
                'approved' => 0,
                'pending' => 0,
            ];

            foreach ($results as $result) {
                $resultStatus = strtolower(trim((string) ($result['account_management_status'] ?? 'pending')));

                if (array_key_exists($resultStatus, $statusCounts)) {
                    $statusCounts[$resultStatus]++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment history fetched successfully',
                'data' => array_values($results),
                'meta' => [
                    'current_page' => $accountManagementRows->currentPage(),
                    'per_page' => $accountManagementRows->perPage(),
                    'total' => $accountManagementRows->total(),
                    'last_page' => $accountManagementRows->lastPage(),
                    'from' => $accountManagementRows->firstItem(),
                    'to' => $accountManagementRows->lastItem(),
                    'available_statuses' => ['All', 'Pending', 'Approved'],
                    'active_status' => 'all',
                    'default_filter' => 'all',
                    'status_counts' => $statusCounts,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment history',
                'errors' => [
                    'error' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    public function approvePayment(Request $request, int $accountManagementId)
    {
        $validated = $request->validate([
            'application_no' => ['required', 'string'],
            'updated_by' => ['required', 'string'],
        ]);

        DB::beginTransaction();

        try {
            $normalizeValue = static function ($value): string {
                return strtoupper(preg_replace('/\s+/', '', trim((string) $value)));
            };

            $formatJsonAmount = static function ($value): string {
                $formatted = number_format((float) $value, 2, '.', '');
                return rtrim(rtrim($formatted, '0'), '.');
            };

            $formatMode = static function ($value): string {
                $mode = trim((string) $value);
                $mode = str_replace('_', ' ', $mode);
                $mode = preg_replace('/\s*\(\s*already\s+paid\s*\)\s*/i', '', $mode);
                $mode = preg_replace('/\s*\(\s*cash\s+paid\s*\)\s*/i', '', $mode);
                $mode = preg_replace('/\s+/', ' ', $mode);
                $mode = trim($mode);

                return $mode !== '' ? $mode : 'Cash';
            };

            $decodeJsonArray = static function ($value): array {
                if (is_array($value)) {
                    return $value;
                }

                if (is_string($value)) {
                    $decoded = json_decode($value, true);

                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        return $decoded;
                    }
                }

                return [];
            };

            $applicationNo = trim((string) $validated['application_no']);
            $updatedBy = trim((string) $validated['updated_by']);
            $normalizedApplicationNo = $normalizeValue($applicationNo);

            $accountManagement = AccountManagement::lockForUpdate()->find($accountManagementId);

            if (!$accountManagement) {
                DB::rollBack();

                return ApiResponse::error(
                    'Account management entry not found',
                    ['account_management_id' => ['Invalid account management id']],
                    404
                );
            }

            $applicationsJson = $decodeJsonArray($accountManagement->applications_json);

            if (empty($applicationsJson)) {
                DB::rollBack();

                return ApiResponse::error(
                    'Applications JSON not found in account management',
                    ['applications_json' => ['No application data available']],
                    422
                );
            }

            $applicationFound = false;
            $matchedApplicationIndex = null;
            $matchedApplicationItem = null;

            foreach ($applicationsJson as $index => $applicationItem) {
                if (!is_array($applicationItem)) {
                    continue;
                }

                $jsonApplicationNo = trim((string) (
                    $applicationItem['application no']
                    ?? $applicationItem['application_no']
                    ?? ''
                ));

                $normalizedJsonApplicationNo = $normalizeValue($jsonApplicationNo);

                if ($normalizedJsonApplicationNo !== $normalizedApplicationNo) {
                    continue;
                }

                $applicationFound = true;
                $matchedApplicationIndex = $index;

                $applicationsJson[$index]['status'] = 'approved';
                $applicationsJson[$index]['payment status'] = 'approved';
                $applicationsJson[$index]['payment_status'] = 'approved';
                $applicationsJson[$index]['approved_by'] = $updatedBy;
                $applicationsJson[$index]['approved_at'] = now()->toDateTimeString();
                $applicationsJson[$index]['updated_by'] = $updatedBy;

                $matchedApplicationItem = $applicationsJson[$index];
                break;
            }

            if (!$applicationFound || $matchedApplicationIndex === null || !is_array($matchedApplicationItem)) {
                DB::rollBack();

                return ApiResponse::error(
                    'Application number not found in account management',
                    ['application_no' => ['Application not mapped with this payment entry']],
                    404
                );
            }

            $accountPaymentTimestamp = $accountManagement->date_of_payment
                ? strtotime((string) $accountManagement->date_of_payment)
                : time();

            if ($accountPaymentTimestamp === false) {
                $accountPaymentTimestamp = time();
            }

            $accountPaymentDate = date('d-m-Y', $accountPaymentTimestamp);
            $paymentMonth = (int) date('n', $accountPaymentTimestamp);
            $paymentYear = (int) date('Y', $accountPaymentTimestamp);

            if ($paymentMonth >= 4) {
                $startYear = $paymentYear;
                $endYear = $startYear + 1;
            } else {
                $startYear = $paymentYear - 1;
                $endYear = $paymentYear;
            }

            $financialYear = $startYear . '-' . substr((string) $endYear, -2);
            $applicationAmount = (float) (
                $matchedApplicationItem['amount']
                ?? $matchedApplicationItem['emi amount']
                ?? $matchedApplicationItem['emi_amount']
                ?? $accountManagement->total_amount
                ?? 0
            );
            $formattedApplicationAmount = number_format($applicationAmount, 2, '.', '');
            $applicationTitle = trim((string) (
                $matchedApplicationItem['title']
                ?? $matchedApplicationItem['scheme_name']
                ?? $matchedApplicationItem['scheme']
                ?? 'Payment Approved'
            ));
            $paymentMode = trim((string) ($accountManagement->payment_mode ?? ''));
            $normalizedPaymentMode = $formatMode($paymentMode);
            $isLoanPayment = str_contains($normalizedApplicationNo, '-LN-');

            $trialBalance = TrialBalance::lockForUpdate()
                ->where('financial_year', $financialYear)
                ->first();

            if (!$trialBalance) {
                $trialBalance = TrialBalance::create([
                    'financial_year' => $financialYear,
                    'opening_balance' => 0,
                    'cash_in_hand' => 0,
                    'bank_balance' => 0,
                    'closing_balance' => 0,
                    'debit_json' => [],
                    'credit_json' => [],
                    'created_by' => $updatedBy,
                    'created_at' => now(),
                    'updated_by' => $updatedBy,
                    'updated_at' => now(),
                ]);
            }

            $debitJson = $decodeJsonArray($trialBalance->debit_json);
            $updatedScheduleItem = null;
            $targetRecordId = null;
            $targetType = null;
            $trialBalanceEntry = null;

            if ($isLoanPayment) {
                $loanEmi = LoanEmi::lockForUpdate()
                    ->where('application_no', $applicationNo)
                    ->first();

                if (!$loanEmi) {
                    $loanEmi = LoanEmi::lockForUpdate()
                        ->get()
                        ->first(function ($row) use ($normalizedApplicationNo, $normalizeValue) {
                            return $normalizeValue($row->application_no) === $normalizedApplicationNo;
                        });
                }

                if (!$loanEmi && !empty($accountManagement->member_id)) {
                    $loanEmi = LoanEmi::lockForUpdate()
                        ->where('member_id', $accountManagement->member_id)
                        ->orderByDesc('id')
                        ->first();
                }

                if (!$loanEmi) {
                    DB::rollBack();

                    return ApiResponse::error(
                        'Loan EMI record not found',
                        ['application_no' => ['No loan EMI record found for this application number']],
                        404
                    );
                }

                $emiSchedule = $decodeJsonArray($loanEmi->emi_schedule);

                if (empty($emiSchedule)) {
                    DB::rollBack();

                    return ApiResponse::error(
                        'Loan EMI schedule is empty',
                        ['emi_schedule' => ['No EMI schedule data found']],
                        422
                    );
                }

                $matchedLoanScheduleIndex = null;

                foreach ($emiSchedule as $index => $emiItem) {
                    if (!is_array($emiItem)) {
                        continue;
                    }

                    $status = strtolower(trim((string) ($emiItem['status'] ?? '')));
                    $emiDate = trim((string) ($emiItem['emi date'] ?? $emiItem['emi_date'] ?? ''));
                    $emiAmount = number_format((float) ($emiItem['emi amount'] ?? $emiItem['emi_amount'] ?? 0), 2, '.', '');

                    if ($status === 'paid') {
                        continue;
                    }

                    if ($emiDate === $accountPaymentDate && $emiAmount === $formattedApplicationAmount) {
                        $matchedLoanScheduleIndex = $index;
                        break;
                    }
                }

                if ($matchedLoanScheduleIndex === null) {
                    foreach ($emiSchedule as $index => $emiItem) {
                        if (!is_array($emiItem)) {
                            continue;
                        }

                        $status = strtolower(trim((string) ($emiItem['status'] ?? '')));
                        $emiDate = trim((string) ($emiItem['emi date'] ?? $emiItem['emi_date'] ?? ''));

                        if ($status === 'paid') {
                            continue;
                        }

                        if ($emiDate === $accountPaymentDate) {
                            $matchedLoanScheduleIndex = $index;
                            break;
                        }
                    }
                }

                if ($matchedLoanScheduleIndex === null) {
                    foreach ($emiSchedule as $index => $emiItem) {
                        if (!is_array($emiItem)) {
                            continue;
                        }

                        $status = strtolower(trim((string) ($emiItem['status'] ?? '')));
                        $emiAmount = number_format((float) ($emiItem['emi amount'] ?? $emiItem['emi_amount'] ?? 0), 2, '.', '');

                        if ($status === 'paid') {
                            continue;
                        }

                        if ($emiAmount === $formattedApplicationAmount) {
                            $matchedLoanScheduleIndex = $index;
                            break;
                        }
                    }
                }

                if ($matchedLoanScheduleIndex === null) {
                    foreach ($emiSchedule as $index => $emiItem) {
                        if (!is_array($emiItem)) {
                            continue;
                        }

                        $status = strtolower(trim((string) ($emiItem['status'] ?? '')));

                        if ($status !== 'paid') {
                            $matchedLoanScheduleIndex = $index;
                            break;
                        }
                    }
                }

                if ($matchedLoanScheduleIndex === null) {
                    DB::rollBack();

                    return ApiResponse::error(
                        'No pending EMI available to approve',
                        ['emi_schedule' => ['All EMI schedule rows are already paid']],
                        422
                    );
                }

                $emiSchedule[$matchedLoanScheduleIndex]['status'] = 'paid';
                $emiSchedule[$matchedLoanScheduleIndex]['updated_by'] = $updatedBy;
                $emiSchedule[$matchedLoanScheduleIndex]['paid_at'] = now()->toDateTimeString();

                $loanEmi->emi_schedule = $emiSchedule;
                $loanEmi->save();

                $updatedScheduleItem = $emiSchedule[$matchedLoanScheduleIndex];
                $targetRecordId = $loanEmi->id;
                $targetType = 'loan_emi';

                $emiAmount = round((float) ($updatedScheduleItem['emi amount'] ?? $updatedScheduleItem['emi_amount'] ?? 0), 2);
                $principalAmount = round((float) ($updatedScheduleItem['principal amount'] ?? $updatedScheduleItem['principal_amount'] ?? 0), 2);
                $interestAmount = round((float) ($updatedScheduleItem['interest amount'] ?? $updatedScheduleItem['interest_amount'] ?? 0), 2);

                $debitJson = array_values(array_filter($debitJson, function ($entry) use ($normalizedApplicationNo, $accountPaymentDate, $normalizeValue) {
                    if (!is_array($entry)) {
                        return true;
                    }

                    $entryApplicationNo = $normalizeValue($entry['application_no'] ?? '');
                    $entryDate = trim((string) ($entry['date'] ?? ''));
                    $entryTitle = strtolower(trim((string) ($entry['title'] ?? '')));

                    if (
                        $entryApplicationNo === $normalizedApplicationNo &&
                        $entryDate === $accountPaymentDate &&
                        in_array($entryTitle, ['loan emi', 'loan emi - loan'], true)
                    ) {
                        return false;
                    }

                    return true;
                }));

                $nextDebitId = 1;

                if (!empty($debitJson)) {
                    $ids = array_map(function ($item) {
                        return (int) ($item['id'] ?? 0);
                    }, $debitJson);

                    $nextDebitId = max($ids) + 1;
                }

                $trialBalanceEntry = [
                    'id' => $nextDebitId,
                    'title' => 'Loan EMI',
                    'application_no' => $applicationNo,
                    'date' => $accountPaymentDate,
                    'emi amount' => $emiAmount,
                    'principal amount' => $principalAmount,
                    'interest amount' => $interestAmount,
                    'mode' => $normalizedPaymentMode,
                    'created_by' => $updatedBy,
                ];

                $debitJson[] = $trialBalanceEntry;
            } else {
                $depositInstallment = DepositInstallment::lockForUpdate()
                    ->where('application_no', $applicationNo)
                    ->first();

                if (!$depositInstallment) {
                    $depositInstallment = DepositInstallment::lockForUpdate()
                        ->get()
                        ->first(function ($row) use ($normalizedApplicationNo, $normalizeValue) {
                            return $normalizeValue($row->application_no) === $normalizedApplicationNo;
                        });
                }

                if (!$depositInstallment && !empty($accountManagement->member_id)) {
                    $depositInstallment = DepositInstallment::lockForUpdate()
                        ->where('member_id', $accountManagement->member_id)
                        ->orderByDesc('id')
                        ->first();
                }

                if (!$depositInstallment) {
                    DB::rollBack();

                    return ApiResponse::error(
                        'Deposit installment record not found',
                        [
                            'application_no' => ['No deposit installment found for this application number'],
                            'debug_application_no' => [$applicationNo],
                            'debug_normalized_application_no' => [$normalizedApplicationNo],
                        ],
                        404
                    );
                }

                $installmentJson = $decodeJsonArray($depositInstallment->installment_json);

                if (empty($installmentJson)) {
                    DB::rollBack();

                    return ApiResponse::error(
                        'Installment JSON is empty',
                        ['installment_json' => ['No installment data found']],
                        422
                    );
                }

                $matchedInstallmentIndex = null;

                foreach ($installmentJson as $index => $installmentItem) {
                    if (!is_array($installmentItem)) {
                        continue;
                    }

                    $status = strtolower(trim((string) ($installmentItem['status'] ?? '')));
                    $date = trim((string) ($installmentItem['date'] ?? ''));
                    $amount = number_format((float) ($installmentItem['amount'] ?? 0), 2, '.', '');

                    if ($status === 'paid') {
                        continue;
                    }

                    if ($date === $accountPaymentDate && $amount === $formattedApplicationAmount) {
                        $matchedInstallmentIndex = $index;
                        break;
                    }
                }

                if ($matchedInstallmentIndex === null) {
                    foreach ($installmentJson as $index => $installmentItem) {
                        if (!is_array($installmentItem)) {
                            continue;
                        }

                        $status = strtolower(trim((string) ($installmentItem['status'] ?? '')));
                        $date = trim((string) ($installmentItem['date'] ?? ''));

                        if ($status === 'paid') {
                            continue;
                        }

                        if ($date === $accountPaymentDate) {
                            $matchedInstallmentIndex = $index;
                            break;
                        }
                    }
                }

                if ($matchedInstallmentIndex === null) {
                    foreach ($installmentJson as $index => $installmentItem) {
                        if (!is_array($installmentItem)) {
                            continue;
                        }

                        $status = strtolower(trim((string) ($installmentItem['status'] ?? '')));
                        $amount = number_format((float) ($installmentItem['amount'] ?? 0), 2, '.', '');

                        if ($status === 'paid') {
                            continue;
                        }

                        if ($amount === $formattedApplicationAmount) {
                            $matchedInstallmentIndex = $index;
                            break;
                        }
                    }
                }

                if ($matchedInstallmentIndex === null) {
                    foreach ($installmentJson as $index => $installmentItem) {
                        if (!is_array($installmentItem)) {
                            continue;
                        }

                        $status = strtolower(trim((string) ($installmentItem['status'] ?? '')));

                        if ($status !== 'paid') {
                            $matchedInstallmentIndex = $index;
                            break;
                        }
                    }
                }

                if ($matchedInstallmentIndex === null) {
                    DB::rollBack();

                    return ApiResponse::error(
                        'No pending installment available to approve',
                        ['installment_json' => ['All installments are already paid']],
                        422
                    );
                }

                $installmentJson[$matchedInstallmentIndex]['status'] = 'paid';
                $installmentJson[$matchedInstallmentIndex]['updated_by'] = $updatedBy;
                $installmentJson[$matchedInstallmentIndex]['paid_at'] = now()->toDateTimeString();

                $depositInstallment->installment_json = $installmentJson;
                $depositInstallment->updated_by = $updatedBy;
                $depositInstallment->updated_at = now();
                $depositInstallment->save();

                $updatedScheduleItem = $installmentJson[$matchedInstallmentIndex];
                $targetRecordId = $depositInstallment->id;
                $targetType = 'deposit_installment';

                $normalizedTrialTitle = strtolower(trim($applicationTitle));
                $formattedTrialBalanceAmount = number_format((float) ($updatedScheduleItem['amount'] ?? $applicationAmount), 2, '.', '');
                $debitExists = false;

                foreach ($debitJson as $entry) {
                    if (!is_array($entry)) {
                        continue;
                    }

                    $entryApplicationNo = $normalizeValue($entry['application_no'] ?? '');
                    $entryDate = trim((string) ($entry['date'] ?? ''));
                    $entryTitle = strtolower(trim((string) ($entry['title'] ?? '')));
                    $entryAmount = number_format((float) ($entry['amount'] ?? 0), 2, '.', '');

                    if (
                        $entryApplicationNo === $normalizedApplicationNo &&
                        $entryDate === $accountPaymentDate &&
                        $entryTitle === $normalizedTrialTitle &&
                        $entryAmount === $formattedTrialBalanceAmount
                    ) {
                        $debitExists = true;
                        $trialBalanceEntry = $entry;
                        break;
                    }
                }

                if (!$debitExists) {
                    $nextDebitId = 1;

                    if (!empty($debitJson)) {
                        $ids = array_map(function ($item) {
                            return (int) ($item['id'] ?? 0);
                        }, $debitJson);

                        $nextDebitId = max($ids) + 1;
                    }

                    $trialBalanceEntry = [
                        'id' => $nextDebitId,
                        'title' => $applicationTitle,
                        'application_no' => $applicationNo,
                        'date' => $accountPaymentDate,
                        'amount' => $formatJsonAmount($updatedScheduleItem['amount'] ?? $applicationAmount),
                        'mode' => $normalizedPaymentMode,
                        'created_by' => $updatedBy,
                    ];

                    $debitJson[] = $trialBalanceEntry;
                }
            }

            $trialBalance->debit_json = $debitJson;
            $trialBalance->updated_by = $updatedBy;
            $trialBalance->updated_at = now();
            $trialBalance->save();

            $accountManagement->applications_json = $applicationsJson;
            $accountManagement->status = 'approved';
            $accountManagement->updated_by = $updatedBy;
            $accountManagement->updated_at = now();
            $accountManagement->save();

            DB::commit();

            return ApiResponse::success('Payment approved successfully', [
                'account_management_id' => $accountManagement->id,
                'application_no' => $applicationNo,
                'account_management_status' => $accountManagement->status,
                'payment_type' => $targetType,
                'target_record_id' => $targetRecordId,
                'approved_schedule_item' => $updatedScheduleItem,
                'applications_json' => $applicationsJson,
                'trial_balance_financial_year' => $financialYear,
                'trial_balance_entry' => $trialBalanceEntry,
                'trial_balance_debit_json' => $debitJson,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return ApiResponse::error(
                'Failed to approve payment',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}