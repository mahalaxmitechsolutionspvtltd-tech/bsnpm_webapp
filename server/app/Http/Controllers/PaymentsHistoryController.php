<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\AccountManagement;
use App\Models\DepositInstallment;
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
            $applicationNo = trim((string) $validated['application_no']);
            $updatedBy = trim((string) $validated['updated_by']);

            $normalizedApplicationNo = strtoupper(preg_replace('/\s+/', '', $applicationNo));

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

            foreach ($applicationsJson as $index => $applicationItem) {
                if (!is_array($applicationItem)) {
                    continue;
                }

                $jsonApplicationNo = trim((string) (
                    $applicationItem['application no']
                    ?? $applicationItem['application_no']
                    ?? ''
                ));

                $normalizedJsonApplicationNo = strtoupper(preg_replace('/\s+/', '', $jsonApplicationNo));

                if ($normalizedJsonApplicationNo !== $normalizedApplicationNo) {
                    continue;
                }

                $applicationFound = true;

                $applicationsJson[$index]['status'] = 'approved';
                $applicationsJson[$index]['payment status'] = 'approved';
                $applicationsJson[$index]['payment_status'] = 'approved';
                $applicationsJson[$index]['approved_by'] = $updatedBy;
                $applicationsJson[$index]['approved_at'] = now()->toDateTimeString();
            }

            if (!$applicationFound) {
                DB::rollBack();
                return ApiResponse::error(
                    'Application number not found in account management',
                    ['application_no' => ['Application not mapped with this payment entry']],
                    404
                );
            }

            $depositInstallment = DepositInstallment::lockForUpdate()
                ->where('application_no', $applicationNo)
                ->first();

            if (!$depositInstallment) {
                $depositInstallment = DepositInstallment::lockForUpdate()
                    ->get()
                    ->first(function ($row) use ($normalizedApplicationNo) {
                        $rowApplicationNo = trim((string) $row->application_no);
                        $normalizedRowApplicationNo = strtoupper(preg_replace('/\s+/', '', $rowApplicationNo));

                        return $normalizedRowApplicationNo === $normalizedApplicationNo;
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

            $accountPaymentDate = $accountManagement->date_of_payment
                ? date('d-m-Y', strtotime((string) $accountManagement->date_of_payment))
                : null;

            $accountAmount = number_format((float) $accountManagement->total_amount, 2, '.', '');

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

                if ($accountPaymentDate !== null && $date === $accountPaymentDate) {
                    $matchedInstallmentIndex = $index;
                    break;
                }

                if ($amount === $accountAmount) {
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

            $accountManagement->applications_json = $applicationsJson;
            $accountManagement->status = 'approved';
            $accountManagement->updated_by = $updatedBy;
            $accountManagement->updated_at = now();
            $accountManagement->save();

            DB::commit();

            return ApiResponse::success('Payment approved successfully', [
                'account_management_id' => $accountManagement->id,
                'application_no' => $applicationNo,
                'deposit_installment_id' => $depositInstallment->id,
                'deposit_installment_application_no' => $depositInstallment->application_no,
                'account_management_status' => $accountManagement->status,
                'approved_installment' => $installmentJson[$matchedInstallmentIndex],
                'applications_json' => $applicationsJson,
                'installment_json' => $installmentJson,
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
