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

            $query = AccountManagement::query()
                ->orderByDesc('id');

            if ($memberId !== '') {
                $query->where('member_id', $memberId);
            }

            $accountManagementRows = $query->get();

            if ($accountManagementRows->isEmpty()) {
                return ApiResponse::success('No payment history found', []);
            }

            $buildProofFileUrl = function ($proofFile) {
                if (empty($proofFile)) {
                    return null;
                }

                $proofFile = trim((string) $proofFile);

                if ($proofFile === '') {
                    return null;
                }

                if (
                    str_starts_with($proofFile, 'http://') ||
                    str_starts_with($proofFile, 'https://')
                ) {
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

            $results = [];

            foreach ($accountManagementRows as $accountRow) {
                $applicationsJson = $accountRow->applications_json;

                if (!is_array($applicationsJson) || empty($applicationsJson)) {
                    continue;
                }

                foreach ($applicationsJson as $applicationItem) {
                    if (!is_array($applicationItem)) {
                        continue;
                    }

                    $jsonApplicationNo = trim((string) (
                        $applicationItem['application no']
                        ?? $applicationItem['application_no']
                        ?? ''
                    ));

                    if ($jsonApplicationNo === '') {
                        continue;
                    }

                    if ($applicationNo !== '' && $jsonApplicationNo !== $applicationNo) {
                        continue;
                    }

                    $depositInstallment = DepositInstallment::where('application_no', $jsonApplicationNo)
                        ->first();

                    if (!$depositInstallment) {
                        $normalizedApplicationNo = strtoupper(preg_replace('/\s+/', '', $jsonApplicationNo));

                        $depositInstallment = DepositInstallment::get()
                            ->first(function ($row) use ($normalizedApplicationNo) {
                                $rowApplicationNo = trim((string) $row->application_no);
                                $normalizedRowApplicationNo = strtoupper(preg_replace('/\s+/', '', $rowApplicationNo));

                                return $normalizedRowApplicationNo === $normalizedApplicationNo;
                            });
                    }

                    $installmentJson = $depositInstallment?->installment_json;
                    $installmentJson = is_array($installmentJson) ? $installmentJson : [];

                    $paidInstallments = [];
                    $pendingInstallments = [];
                    $approvedInstallments = [];
                    $otherInstallments = [];

                    foreach ($installmentJson as $installmentItem) {
                        if (!is_array($installmentItem)) {
                            continue;
                        }

                        $installmentStatus = strtolower(trim((string) ($installmentItem['status'] ?? 'pending')));

                        if ($installmentStatus === 'paid') {
                            $paidInstallments[] = $installmentItem;
                        } elseif ($installmentStatus === 'approved') {
                            $approvedInstallments[] = $installmentItem;
                        } elseif ($installmentStatus === 'pending') {
                            $pendingInstallments[] = $installmentItem;
                        } else {
                            $otherInstallments[] = $installmentItem;
                        }
                    }

                    $applicationStatus = trim((string) (
                        $applicationItem['payment status']
                        ?? $applicationItem['payment_status']
                        ?? $applicationItem['status']
                        ?? $accountRow->status
                        ?? 'pending'
                    ));

                    $results[] = [
                        'id' => $accountRow->id,
                        'account_management_id' => $accountRow->id,
                        'member_id' => $accountRow->member_id,
                        'member_name' => $accountRow->member_name,
                        'submitted_on' => $accountRow->created_at
                            ? \Carbon\Carbon::parse($accountRow->created_at)->format('Y-m-d')
                            : null,
                        'submitted_time' => $accountRow->created_at
                            ? \Carbon\Carbon::parse($accountRow->created_at)->format('H:i:s')
                            : null,
                        'date_of_payment' => $accountRow->date_of_payment,
                        'date_paid' => $accountRow->date_of_payment,
                        'amount' => $applicationItem['amount'] ?? $accountRow->total_amount,
                        'total_amount' => $accountRow->total_amount,
                        'payment_mode' => $accountRow->payment_mode,
                        'proof_file' => $buildProofFileUrl($accountRow->proof_file),
                        'proof_file_url' => $buildProofFileUrl($accountRow->proof_file),
                        'proof_file_name' => !empty($accountRow->proof_file)
                            ? basename(str_replace('\\', '/', (string) $accountRow->proof_file))
                            : null,
                        'reference_trn' => $accountRow->reference_trn,
                        'remark' => $accountRow->remark,
                        'status' => $applicationStatus,
                        'created_by' => $accountRow->created_by,
                        'created_at' => $accountRow->created_at,
                        'submitted_at' => $accountRow->created_at,
                        'application_no' => $jsonApplicationNo,
                        'source_type' => 'deposit',

                        'application_details' => [
                            'title' => $applicationItem['title'] ?? null,
                            'member_name' => $applicationItem['member name'] ?? null,
                            'amount' => $applicationItem['amount'] ?? null,
                            'application_no' => $jsonApplicationNo,
                            'tenure' => $applicationItem['tenure'] ?? null,
                        ],

                        'proof' => [
                            'file_url' => $buildProofFileUrl($accountRow->proof_file),
                            'file_name' => !empty($accountRow->proof_file)
                                ? basename(str_replace('\\', '/', (string) $accountRow->proof_file))
                                : null,
                            'file_type' => !empty($accountRow->proof_file)
                                ? pathinfo(str_replace('\\', '/', (string) $accountRow->proof_file), PATHINFO_EXTENSION)
                                : null,
                        ],

                        'deposit_installment' => $depositInstallment ? [
                            'id' => $depositInstallment->id,
                            'application_no' => $depositInstallment->application_no,
                            'start_date' => $depositInstallment->start_date,
                            'end_date' => $depositInstallment->end_date,
                            'amount' => $depositInstallment->amount,
                            'installment_json' => $installmentJson,
                            'paid_installment_json' => array_values($paidInstallments),
                            'approved_installment_json' => array_values($approvedInstallments),
                            'pending_installment_json' => array_values($pendingInstallments),
                            'other_installment_json' => array_values($otherInstallments),
                        ] : null,
                    ];
                }
            }

            return ApiResponse::success('Deposit payment history fetched successfully', array_values($results));
        } catch (\Exception $e) {
            return ApiResponse::error(
                'Failed to fetch deposit payment history',
                ['error' => $e->getMessage()],
                500
            );
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

            $applicationsJson = $accountManagement->applications_json;
            $applicationsJson = is_array($applicationsJson) ? $applicationsJson : [];

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
                $applicationsJson[$index]['approved_by'] = $updatedBy;
                $applicationsJson[$index]['approved_at'] = now()->toDateTimeString();

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

                $emiSchedule = $loanEmi->emi_schedule;
                $emiSchedule = is_array($emiSchedule) ? $emiSchedule : [];

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

                $installmentJson = $depositInstallment->installment_json;
                $installmentJson = is_array($installmentJson) ? $installmentJson : [];

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
            }

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

            $creditJson = $trialBalance->credit_json;
            $creditJson = is_array($creditJson) ? $creditJson : [];

            if ($isLoanPayment) {
                $emiAmount = round((float) ($updatedScheduleItem['emi amount'] ?? $updatedScheduleItem['emi_amount'] ?? 0), 2);
                $principalAmount = round((float) ($updatedScheduleItem['principal amount'] ?? $updatedScheduleItem['principal_amount'] ?? 0), 2);
                $interestAmount = round((float) ($updatedScheduleItem['interest amount'] ?? $updatedScheduleItem['interest_amount'] ?? 0), 2);

                $creditJson = array_values(array_filter($creditJson, function ($entry) use ($normalizedApplicationNo, $accountPaymentDate, $normalizeValue) {
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

                $nextCreditId = 1;

                if (!empty($creditJson)) {
                    $ids = array_map(function ($item) {
                        return (int) ($item['id'] ?? 0);
                    }, $creditJson);

                    $nextCreditId = max($ids) + 1;
                }

                $trialBalanceEntry = [
                    'id' => $nextCreditId,
                    'title' => 'Loan EMI',
                    'application_no' => $applicationNo,
                    'date' => $accountPaymentDate,
                    'emi amount' => $emiAmount,
                    'principal amount' => $principalAmount,
                    'interest amount' => $interestAmount,
                    'mode' => $normalizedPaymentMode,
                    'created_by' => $updatedBy,
                ];

                $creditJson[] = $trialBalanceEntry;
            } else {
                $normalizedTrialTitle = strtolower(trim($applicationTitle));
                $formattedTrialBalanceAmount = number_format((float) ($updatedScheduleItem['amount'] ?? $applicationAmount), 2, '.', '');
                $creditExists = false;

                foreach ($creditJson as $entry) {
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
                        $creditExists = true;
                        $trialBalanceEntry = $entry;
                        break;
                    }
                }

                if (!$creditExists) {
                    $nextCreditId = 1;

                    if (!empty($creditJson)) {
                        $ids = array_map(function ($item) {
                            return (int) ($item['id'] ?? 0);
                        }, $creditJson);

                        $nextCreditId = max($ids) + 1;
                    }

                    $trialBalanceEntry = [
                        'id' => $nextCreditId,
                        'title' => $applicationTitle,
                        'application_no' => $applicationNo,
                        'date' => $accountPaymentDate,
                        'amount' => $formatJsonAmount($updatedScheduleItem['amount'] ?? $applicationAmount),
                        'mode' => $normalizedPaymentMode,
                        'created_by' => $updatedBy,
                    ];

                    $creditJson[] = $trialBalanceEntry;
                }
            }

            $trialBalance->credit_json = $creditJson;
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
                'trial_balance_credit_json' => $creditJson,
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
