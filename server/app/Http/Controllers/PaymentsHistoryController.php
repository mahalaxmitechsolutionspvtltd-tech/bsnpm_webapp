<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\AccountManagement;
use App\Models\DepositInstallment;
use App\Models\LoanEmi;
use App\Models\TrialBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use function Illuminate\Support\now;

class PaymentsHistoryController extends Controller
{
    public function getPaymentHistory(Request $request)
    {
        try {
            $memberId = trim((string) $request->query('member_id', ''));
            $applicationNo = trim((string) $request->query('application_no', ''));
            $requestedStatus = strtolower(trim((string) $request->query('status', 'pending')));
            $hasExplicitStatusFilter = $requestedStatus !== '';
            $page = (int) $request->query('page', 1);
            $perPage = (int) $request->query('per_page', 100);

            $page = $page > 0 ? $page : 1;
            $perPage = $perPage > 0 ? $perPage : 100;
            $perPage = min($perPage, 100);

            $allowedStatuses = ['approved', 'pending', 'paid'];

            if ($hasExplicitStatusFilter && !in_array($requestedStatus, $allowedStatuses, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid status filter',
                    'errors' => [
                        'status' => ['Allowed values are approved, pending, paid.'],
                    ],
                ], 422);
            }

            $query = AccountManagement::query()->orderByDesc('id');

            if ($memberId !== '') {
                $query->where('member_id', $memberId);
            }

            $accountManagementRows = $query->get();

            if ($accountManagementRows->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No payment history found',
                    'data' => [],
                    'meta' => [
                        'current_page' => $page,
                        'per_page' => $perPage,
                        'total' => 0,
                        'last_page' => 1,
                        'from' => null,
                        'to' => null,
                        'available_statuses' => ['approved', 'pending'],
                        'active_status' => $requestedStatus,
                        'default_filter' => 'application_pending_installment_paid_date_matched',
                        'status_counts' => [
                            'approved' => 0,
                            'pending' => 0,
                            'paid' => 0,
                        ],
                    ],
                ]);
            }

            $buildProofFileUrl = function ($proofFile) {
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

            $normalizeJsonArray = function ($value) {
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

            $normalizeStatus = function ($value) {
                $status = strtolower(trim((string) ($value ?? 'pending')));

                if ($status === '') {
                    return 'pending';
                }

                return $status;
            };

            $normalizeAmount = function ($value) {
                if ($value === null || $value === '') {
                    return 0.00;
                }

                $amount = (float) str_replace(',', '', (string) $value);

                return round($amount, 2);
            };

            $formatAmount = function ($value) use ($normalizeAmount) {
                return number_format($normalizeAmount($value), 2, '.', '');
            };

            $normalizeDateKey = function ($value) {
                if (empty($value)) {
                    return null;
                }

                $rawValue = trim((string) $value);

                if ($rawValue === '') {
                    return null;
                }

                try {
                    if (preg_match('/^\d{2}-\d{2}-\d{4}$/', $rawValue)) {
                        return \Carbon\Carbon::createFromFormat('d-m-Y', $rawValue)->format('Y-m-d');
                    }

                    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $rawValue)) {
                        return \Carbon\Carbon::createFromFormat('Y-m-d', $rawValue)->format('Y-m-d');
                    }

                    return \Carbon\Carbon::parse($rawValue)->format('Y-m-d');
                } catch (\Throwable $e) {
                    return null;
                }
            };

            $getApplicationNo = function (array $applicationItem) {
                return trim((string) (
                    $applicationItem['application no']
                    ?? $applicationItem['application_no']
                    ?? $applicationItem['app_no']
                    ?? ''
                ));
            };

            $getApplicationTitle = function (array $applicationItem) {
                return trim((string) (
                    $applicationItem['title']
                    ?? $applicationItem['detail']
                    ?? $applicationItem['name']
                    ?? $applicationItem['scheme_name']
                    ?? 'Payment'
                ));
            };

            $getApplicationMemberName = function (array $applicationItem, $fallbackName) {
                return trim((string) (
                    $applicationItem['member name']
                    ?? $applicationItem['member_name']
                    ?? $fallbackName
                    ?? ''
                ));
            };

            $getApplicationAmount = function (array $applicationItem, $fallbackAmount) use ($normalizeAmount) {
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

            $isJoiningShareEmergencyItem = function (string $title, string $applicationNo) {
                $normalizedTitle = strtolower($title);
                $normalizedApplicationNo = strtolower($applicationNo);

                return $applicationNo === ''
                    || str_contains($normalizedTitle, 'joining')
                    || str_contains($normalizedTitle, 'share capital')
                    || str_contains($normalizedTitle, 'emergency')
                    || str_contains($normalizedApplicationNo, 'joining')
                    || str_contains($normalizedApplicationNo, 'share')
                    || str_contains($normalizedApplicationNo, 'emergency');
            };

            $findDepositInstallment = function (string $jsonApplicationNo) {
                if ($jsonApplicationNo === '') {
                    return null;
                }

                $depositInstallment = DepositInstallment::where('application_no', $jsonApplicationNo)->first();

                if ($depositInstallment) {
                    return $depositInstallment;
                }

                $normalizedApplicationNo = strtoupper(preg_replace('/\s+/', '', $jsonApplicationNo));

                return DepositInstallment::get()->first(function ($row) use ($normalizedApplicationNo) {
                    $rowApplicationNo = trim((string) $row->application_no);
                    $normalizedRowApplicationNo = strtoupper(preg_replace('/\s+/', '', $rowApplicationNo));

                    return $normalizedRowApplicationNo === $normalizedApplicationNo;
                });
            };

            $makeProofPayload = function ($accountRow) use ($buildProofFileUrl) {
                $proofFileUrl = $buildProofFileUrl($accountRow->proof_file);
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

            $makeBaseRow = function ($accountRow, $amount, $status, $applicationNoValue, $applicationDetails, $sourceType, $applicationStatus, $installmentStatus) use ($makeProofPayload, $formatAmount, $normalizeStatus) {
                $proofPayload = $makeProofPayload($accountRow);
                $accountManagementStatus = $normalizeStatus($accountRow->status ?? 'pending');

                return [
                    'id' => $accountRow->id,
                    'account_management_id' => $accountRow->id,
                    'member_id' => $accountRow->member_id,
                    'member_name' => $accountRow->member_name,
                    'submitted_on' => $accountRow->created_at ? \Carbon\Carbon::parse($accountRow->created_at)->format('Y-m-d') : null,
                    'submitted_time' => $accountRow->created_at ? \Carbon\Carbon::parse($accountRow->created_at)->format('H:i:s') : null,
                    'date_of_payment' => $accountRow->date_of_payment,
                    'date_paid' => $accountRow->date_of_payment,
                    'amount' => (float) $amount,
                    'total_amount' => $formatAmount($amount),
                    'payment_mode' => $accountRow->payment_mode,
                    'proof_file' => $proofPayload['proof_file'],
                    'proof_file_url' => $proofPayload['proof_file_url'],
                    'proof_file_name' => $proofPayload['proof_file_name'],
                    'reference_trn' => $accountRow->reference_trn,
                    'remark' => $accountRow->remark,
                    'status' => $status,
                    'account_management_status' => $accountManagementStatus,
                    'application_status' => $applicationStatus,
                    'installment_status' => $installmentStatus,
                    'created_by' => $accountRow->created_by,
                    'created_at' => $accountRow->created_at,
                    'submitted_at' => $accountRow->created_at,
                    'application_no' => $applicationNoValue,
                    'source_type' => $sourceType,
                    'application_details' => $applicationDetails,
                    'proof' => $proofPayload['proof'],
                ];
            };

            $allResults = [];

            foreach ($accountManagementRows as $accountRow) {
                $applicationsJson = $normalizeJsonArray($accountRow->applications_json);

                if (empty($applicationsJson)) {
                    continue;
                }

                $accountManagementStatus = $normalizeStatus($accountRow->status ?? 'pending');
                $accountPaymentDateKey = $normalizeDateKey($accountRow->date_of_payment ?? $accountRow->created_at);
                $joiningShareEmergencyItems = [];

                foreach ($applicationsJson as $applicationItem) {
                    if (!is_array($applicationItem)) {
                        continue;
                    }

                    $jsonApplicationNo = $getApplicationNo($applicationItem);
                    $title = $getApplicationTitle($applicationItem);

                    if ($applicationNo !== '' && $jsonApplicationNo !== $applicationNo) {
                        continue;
                    }

                    if ($isJoiningShareEmergencyItem($title, $jsonApplicationNo)) {
                        $joiningShareEmergencyItems[] = $applicationItem;
                        continue;
                    }

                    if ($jsonApplicationNo === '') {
                        continue;
                    }

                    $depositInstallment = $findDepositInstallment($jsonApplicationNo);
                    $installmentJson = $normalizeJsonArray($depositInstallment?->installment_json);
                    $applicationStatus = $normalizeStatus(
                        $applicationItem['payment status']
                        ?? $applicationItem['payment_status']
                        ?? $applicationItem['status']
                        ?? $accountRow->status
                        ?? 'pending'
                    );
                    $applicationAmount = $getApplicationAmount($applicationItem, $accountRow->total_amount);

                    if (empty($installmentJson)) {
                        if ($applicationStatus !== $requestedStatus) {
                            continue;
                        }

                        $row = array_merge(
                            $makeBaseRow(
                                $accountRow,
                                $applicationAmount,
                                $applicationStatus,
                                $jsonApplicationNo,
                                [
                                    'title' => $title,
                                    'member_name' => $getApplicationMemberName($applicationItem, $accountRow->member_name),
                                    'amount' => $applicationAmount,
                                    'application_no' => $jsonApplicationNo,
                                    'tenure' => $getApplicationTenure($applicationItem),
                                ],
                                'deposit',
                                $applicationStatus,
                                null
                            ),
                            [
                                'installment' => null,
                            ]
                        );

                        $uniqueKey = implode('|', [
                            $row['member_id'] ?? '',
                            $row['application_no'] ?? '',
                            $row['account_management_id'] ?? '',
                            $row['status'] ?? '',
                            $row['total_amount'] ?? '',
                        ]);

                        $allResults[$uniqueKey] = $row;

                        continue;
                    }

                    foreach ($installmentJson as $installmentItem) {
                        if (!is_array($installmentItem)) {
                            continue;
                        }

                        $installmentStatus = $normalizeStatus($installmentItem['status'] ?? 'pending');
                        $installmentDateKey = $normalizeDateKey($installmentItem['date'] ?? null);

                        if ($requestedStatus === 'pending') {
                            if ($applicationStatus !== 'pending' || $installmentStatus !== 'paid') {
                                continue;
                            }

                            if ($accountPaymentDateKey === null || $installmentDateKey === null || $accountPaymentDateKey !== $installmentDateKey) {
                                continue;
                            }
                        }

                        if ($requestedStatus === 'approved') {
                            if ($applicationStatus !== 'approved' && $accountManagementStatus !== 'approved') {
                                continue;
                            }
                        }

                        if ($requestedStatus === 'paid') {
                            if ($installmentStatus !== 'paid') {
                                continue;
                            }
                        }

                        $installmentAmount = $normalizeAmount($installmentItem['amount'] ?? $depositInstallment?->amount ?? $applicationAmount);

                        $row = array_merge(
                            $makeBaseRow(
                                $accountRow,
                                $installmentAmount,
                                $applicationStatus,
                                $jsonApplicationNo,
                                [
                                    'title' => $title,
                                    'member_name' => $getApplicationMemberName($applicationItem, $accountRow->member_name),
                                    'amount' => $installmentAmount,
                                    'application_no' => $jsonApplicationNo,
                                    'tenure' => $getApplicationTenure($applicationItem),
                                ],
                                'deposit',
                                $applicationStatus,
                                $installmentStatus
                            ),
                            [
                                'installment' => [
                                    'date' => $installmentItem['date'] ?? null,
                                    'amount' => $formatAmount($installmentAmount),
                                    'status' => $installmentStatus,
                                    'updated_by' => $installmentItem['updated_by'] ?? $depositInstallment?->updated_by ?? null,
                                ],
                            ]
                        );

                        $uniqueKey = implode('|', [
                            $row['member_id'] ?? '',
                            $row['application_no'] ?? '',
                            $installmentDateKey ?? '',
                            $row['installment_status'] ?? '',
                            $row['total_amount'] ?? '',
                        ]);

                        if (!isset($allResults[$uniqueKey])) {
                            $allResults[$uniqueKey] = $row;
                            continue;
                        }

                        $existingId = (int) ($allResults[$uniqueKey]['account_management_id'] ?? 0);
                        $currentId = (int) ($row['account_management_id'] ?? 0);

                        if ($currentId > $existingId) {
                            $allResults[$uniqueKey] = $row;
                        }
                    }
                }

                if (!empty($joiningShareEmergencyItems) && $applicationNo === '') {
                    $breakdown = [];
                    $totalAmount = 0.00;
                    $rowStatus = $accountManagementStatus;
                    $titles = [];

                    if ($rowStatus !== $requestedStatus) {
                        continue;
                    }

                    foreach ($joiningShareEmergencyItems as $applicationItem) {
                        if (!is_array($applicationItem)) {
                            continue;
                        }

                        $title = $getApplicationTitle($applicationItem);
                        $amount = $getApplicationAmount($applicationItem, 0);

                        $titles[] = $title;
                        $totalAmount += $amount;

                        $breakdown[] = [
                            'title' => $title,
                            'member_name' => $getApplicationMemberName($applicationItem, $accountRow->member_name),
                            'amount' => $amount,
                            'application_no' => null,
                            'tenure' => $getApplicationTenure($applicationItem),
                        ];
                    }

                    if ($totalAmount <= 0) {
                        $totalAmount = $normalizeAmount($accountRow->total_amount);
                    }

                    $row = array_merge(
                        $makeBaseRow(
                            $accountRow,
                            $totalAmount,
                            $rowStatus,
                            null,
                            [
                                'title' => implode(' + ', array_values(array_filter($titles))),
                                'member_name' => $accountRow->member_name,
                                'amount' => $totalAmount,
                                'application_no' => null,
                                'tenure' => null,
                                'breakdown' => array_values($breakdown),
                            ],
                            'member_fund',
                            $rowStatus,
                            null
                        ),
                        [
                            'installment' => null,
                        ]
                    );

                    $uniqueKey = implode('|', [
                        $row['member_id'] ?? '',
                        $row['source_type'] ?? '',
                        $row['date_of_payment'] ?? '',
                        $row['status'] ?? '',
                        $row['total_amount'] ?? '',
                        $row['reference_trn'] ?? '',
                    ]);

                    if (!isset($allResults[$uniqueKey])) {
                        $allResults[$uniqueKey] = $row;
                        continue;
                    }

                    $existingId = (int) ($allResults[$uniqueKey]['account_management_id'] ?? 0);
                    $currentId = (int) ($row['account_management_id'] ?? 0);

                    if ($currentId > $existingId) {
                        $allResults[$uniqueKey] = $row;
                    }
                }
            }

            $statusCounts = [
                'approved' => 0,
                'pending' => 0,
                'paid' => 0,
            ];

            foreach ($allResults as $result) {
                $applicationResultStatus = strtolower(trim((string) ($result['application_status'] ?? '')));
                $installmentResultStatus = strtolower(trim((string) ($result['installment_status'] ?? '')));

                if (array_key_exists($applicationResultStatus, $statusCounts)) {
                    $statusCounts[$applicationResultStatus]++;
                }

                if ($installmentResultStatus !== '' && array_key_exists($installmentResultStatus, $statusCounts)) {
                    $statusCounts[$installmentResultStatus]++;
                }
            }

            $results = array_values($allResults);

            usort($results, function ($first, $second) {
                $firstDate = strtotime((string) ($first['date_of_payment'] ?? $first['created_at'] ?? ''));
                $secondDate = strtotime((string) ($second['date_of_payment'] ?? $second['created_at'] ?? ''));

                if ($firstDate === $secondDate) {
                    return (int) ($second['account_management_id'] ?? 0) <=> (int) ($first['account_management_id'] ?? 0);
                }

                return $secondDate <=> $firstDate;
            });

            $total = count($results);
            $lastPage = max(1, (int) ceil($total / $perPage));
            $page = min($page, $lastPage);
            $offset = ($page - 1) * $perPage;
            $paginatedResults = array_slice($results, $offset, $perPage);
            $from = $total > 0 ? $offset + 1 : null;
            $to = $total > 0 ? min($offset + count($paginatedResults), $total) : null;

            return response()->json([
                'success' => true,
                'message' => 'Deposit payment history fetched successfully',
                'data' => array_values($paginatedResults),
                'meta' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => $lastPage,
                    'from' => $from,
                    'to' => $to,
                    'available_statuses' => ['approved', 'pending'],
                    'active_status' => $requestedStatus,
                    'default_filter' => 'application_pending_installment_paid_date_matched',
                    'status_counts' => $statusCounts,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch deposit payment history',
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