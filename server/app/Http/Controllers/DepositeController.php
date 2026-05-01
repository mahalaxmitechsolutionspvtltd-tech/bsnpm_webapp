<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\AccountManagement;
use App\Models\DepositApplication;
use App\Models\DepositInstallment;
use App\Models\DepositRenewalApplication;
use App\Models\DepositScheme;
use App\Models\TrialBalance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Log;

class DepositeController extends Controller
{
    public function getDepostiteSchemes()
    {
        $depositeSchemes = DepositScheme::where('is_deleted', 0)
            ->orderByDesc('id')
            ->get();

        if ($depositeSchemes->isEmpty()) {
            return ApiResponse::success('No deposit schemes found', []);
        }

        return ApiResponse::success(
            'Deposit schemes fetched successfully',
            $depositeSchemes
        );
    }

    public function addDepositeScheme(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'scheme_name' => 'required|string|max:150',
            'scheme_details' => 'nullable|string',
            'interest_rate' => 'nullable|numeric|min:0|max:999.99',
            'term_notes' => 'nullable|string',
            'investment_terms' => 'nullable|string',
            'created_by' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return ApiResponse::error(
                'Validation failed',
                $validator->errors(),
                422
            );
        }

        $scheme = DepositScheme::create([
            'scheme_name' => $request->scheme_name,
            'scheme_details' => $request->scheme_details,
            'interest_rate' => $request->interest_rate,
            'term_notes' => $request->term_notes,
            'investment_terms' => $request->investment_terms,
            'created_by' => $request->created_by,
            'created_at' => now(),
            'updated_by' => null,
            'updated_at' => null,
            'is_deleted' => 0,
            'deleted_by' => null,
        ]);

        return ApiResponse::success(
            'Deposit scheme added successfully',
            $scheme
        );
    }

    public function updateDepositeScheme(Request $request, $id)
    {
        $scheme = DepositScheme::where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$scheme) {
            return ApiResponse::error('Deposit scheme not found', null, 404);
        }

        $validator = Validator::make($request->all(), [
            'scheme_name' => 'required|string|max:150',
            'scheme_details' => 'nullable|string',
            'interest_rate' => 'nullable|numeric|min:0|max:999.99',
            'term_notes' => 'nullable|string',
            'investment_terms' => 'nullable|string',
            'updated_by' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return ApiResponse::error(
                'Validation failed',
                $validator->errors(),
                422
            );
        }

        $scheme->update([
            'scheme_name' => $request->scheme_name,
            'scheme_details' => $request->scheme_details,
            'interest_rate' => $request->interest_rate,
            'term_notes' => $request->term_notes,
            'investment_terms' => $request->investment_terms,
            'updated_by' => $request->updated_by,
            'updated_at' => now(),
        ]);

        return ApiResponse::success(
            'Deposit scheme updated successfully',
            $scheme->fresh()
        );
    }

    public function deleteDepositeScheme(Request $request, $id)
    {
        $scheme = DepositScheme::where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$scheme) {
            return ApiResponse::error('Deposit scheme not found', null, 404);
        }

        $scheme->update([
            'is_deleted' => 1,
            'deleted_by' => $request->deleted_by,
            'updated_at' => now(),
        ]);

        return ApiResponse::success(
            'Deposit scheme deleted successfully',
            null
        );
    }

    public function getDepositeApplications()
    {
        try {
            $applications = DepositApplication::where('is_withdrawal', 0)
                ->orderByDesc('id')
                ->get();

            if ($applications->isEmpty()) {
                return ApiResponse::error('Application not found..', [], 404);
            }

            $memberIds = $applications
                ->pluck('member_id')
                ->filter()
                ->unique()
                ->values()
                ->toArray();

            $accountManagementRows = AccountManagement::whereIn('member_id', $memberIds)
                ->orderByDesc('id')
                ->get()
                ->groupBy('member_id');

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

            $finalData = $applications->map(function ($application) use ($accountManagementRows, $buildProofFileUrl) {
                $memberAccounts = $accountManagementRows->get($application->member_id, collect());

                $matchedApplicationJson = null;
                $matchedAccountRow = null;

                foreach ($memberAccounts as $accountRow) {
                    $applicationsJson = $accountRow->applications_json;

                    if (is_string($applicationsJson)) {
                        $decodedApplicationsJson = json_decode($applicationsJson, true);
                        $applicationsJson = is_array($decodedApplicationsJson) ? $decodedApplicationsJson : [];
                    }

                    if (!is_array($applicationsJson)) {
                        continue;
                    }

                    foreach ($applicationsJson as $jsonItem) {
                        if (
                            is_array($jsonItem) &&
                            isset($jsonItem['application no']) &&
                            trim((string) $jsonItem['application no']) === trim((string) $application->application_no)
                        ) {
                            if ($matchedAccountRow === null) {
                                $matchedApplicationJson = $jsonItem;
                                $matchedAccountRow = $accountRow;
                            }

                            if (!empty($accountRow->proof_file)) {
                                $matchedApplicationJson = $jsonItem;
                                $matchedAccountRow = $accountRow;
                                break 2;
                            }
                        }
                    }
                }

                return [
                    'id' => $application->id,
                    'application_no' => $application->application_no,
                    'application_type' => $application->application_type,
                    'member_id' => $application->member_id,
                    'member_name' => $application->member_name,
                    'member_email' => $application->member_email,
                    'scheme_id' => $application->scheme_id,
                    'scheme_name' => $application->scheme_name,
                    'interest_rate' => $application->interest_rate,
                    'tenure_years' => $application->tenure_years,
                    'deposit_amount' => $application->deposit_amount,
                    'start_date' => $application->start_date,
                    'end_date' => $application->end_date,
                    'status' => $application->status,
                    'is_active' => $application->is_active,
                    'is_withdrawal' => $application->is_withdrawal,
                    'is_renewed' => $application->is_renewed,
                    'created_by' => $application->created_by,
                    'created_at' => $application->created_at,
                    'updated_by' => $application->updated_by,
                    'updated_at' => $application->updated_at,
                    'payment_details' => $matchedAccountRow ? [
                        'id' => $matchedAccountRow->id,
                        'payment_mode' => $matchedAccountRow->payment_mode,
                        'proof_file' => $buildProofFileUrl($matchedAccountRow->proof_file),
                        'proof_file_name' => !empty($matchedAccountRow->proof_file)
                            ? basename(str_replace('\\', '/', (string) $matchedAccountRow->proof_file))
                            : null,
                        'reference_trn' => $matchedAccountRow->reference_trn,
                        'total_amount' => $matchedAccountRow->total_amount,
                        'date_of_payment' => $matchedAccountRow->date_of_payment,
                        'remark' => $matchedAccountRow->remark,
                        'status' => $matchedAccountRow->status,
                        'created_by' => $matchedAccountRow->created_by,
                        'created_at' => $matchedAccountRow->created_at,
                    ] : null,
                    'matched_application_json' => $matchedApplicationJson,
                ];
            });

            return ApiResponse::success('Applications fetched successfully', $finalData);
        } catch (\Exception $e) {
            return ApiResponse::error(
                'Failed to fetch applications',
                ['error' => $e->getMessage()],
                500
            );
        }
    }


    // Approve the deposite application status
    public function updateDepositeApplicationStatus(Request $request, $application_id)
{
    $validator = Validator::make($request->all(), [
        'status' => 'required|string|in:pending,approved,rejected,active,inprogress,completed,closed,withdrawn',
        'updated_by' => 'nullable|string|max:100',
    ]);

    if ($validator->fails()) {
        return ApiResponse::error(
            'Validation failed',
            $validator->errors(),
            422
        );
    }

    $application = DepositApplication::where('id', $application_id)->first();

    if (!$application) {
        return ApiResponse::error('Application not found', null, 404);
    }

    $status = strtolower(trim((string) $request->status));

    DB::beginTransaction();

    try {
        $updateData = [
            'status' => $status,
            'updated_by' => $request->updated_by,
            'updated_at' => now(),
        ];

        if ($status === 'withdrawn') {
            $updateData['is_withdrawal'] = 1;
            $updateData['is_active'] = 0;
        }

        if (in_array($status, ['active', 'inprogress'], true)) {
            $updateData['is_active'] = 1;
        }

        if (in_array($status, ['rejected', 'closed', 'completed'], true)) {
            $updateData['is_active'] = 0;
        }

        $application->update($updateData);

        if ($status === 'approved') {
            $applicationNo = trim((string) $application->application_no);
            $memberId = trim((string) $application->member_id);
            $isOneTimeDepositScheme = $this->isOneTimeDepositScheme((string) ($application->scheme_name ?? ''));

            $accountManagementRecords = AccountManagement::where('member_id', $memberId)->get();

            foreach ($accountManagementRecords as $accountRecord) {
                $applicationsJson = $accountRecord->applications_json;

                if (is_string($applicationsJson)) {
                    $decodedApplicationsJson = json_decode($applicationsJson, true);
                    $applicationsJson = is_array($decodedApplicationsJson) ? $decodedApplicationsJson : [];
                }

                if (!is_array($applicationsJson) || empty($applicationsJson)) {
                    continue;
                }

                $hasMatch = false;
                $matchedPaymentMode = null;
                $matchedTitle = null;

                foreach ($applicationsJson as $row) {
                    if (!is_array($row)) {
                        continue;
                    }

                    $rowApplicationNo = $this->getApplicationNoFromJsonRow($row);
                    $hasApplyPayment = $this->getBooleanValueFromJsonRow($row, [
                        'apply payment',
                        'apply_payment',
                        'applyPayment',
                    ]);
                    $hasFirstPayment = $this->getBooleanValueFromJsonRow($row, [
                        'first payment',
                        'first_payment',
                        'firstPayment',
                    ]);

                    if (trim((string) $rowApplicationNo) === $applicationNo && ($hasApplyPayment === true || $hasFirstPayment === true)) {
                        $hasMatch = true;
                        $matchedPaymentMode = $accountRecord->payment_mode ?? 'online';
                        $matchedTitle = $this->getTitleFromJsonRow($row, (string) ($application->scheme_name ?? 'Deposit Application'));
                        break;
                    }
                }

                if ($hasMatch) {
                    $accountRecord->update([
                        'status' => 'approved',
                        'updated_by' => $request->updated_by,
                        'updated_at' => now(),
                    ]);

                    if (!$isOneTimeDepositScheme) {
                        $this->markFirstDepositInstallmentPaidForApplication(
                            $applicationNo,
                            (string) ($request->updated_by ?? '')
                        );
                    }

                    $this->addDepositApplicationToTrialBalance(
                        (string) $matchedTitle,
                        $applicationNo,
                        now(),
                        (float) ($application->deposit_amount ?? 0),
                        !empty($matchedPaymentMode) ? (string) $matchedPaymentMode : 'online',
                        (string) ($request->updated_by ?? '')
                    );

                    break;
                }
            }
        }

        DB::commit();

        return ApiResponse::success(
            'Application status updated successfully',
            $application->fresh()
        );
    } catch (\Throwable $e) {
        DB::rollBack();

        return ApiResponse::error(
            'Failed to update application status',
            ['error' => $e->getMessage()],
            500
        );
    }
}

    public function updateApplicationStartDate(Request $request, $application_id)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'updated_by' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return ApiResponse::error(
                'Validation failed',
                $validator->errors(),
                422
            );
        }

        $application = DepositApplication::where('id', $application_id)->first();

        if (!$application) {
            return ApiResponse::error('Application not found', null, 404);
        }

        if (strtolower(trim((string) $application->status)) !== 'approved') {
            return ApiResponse::error(
                'Start date and end date can only be updated when application status is approved',
                null,
                422
            );
        }

        DB::beginTransaction();

        try {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $tenureYears = (int) $application->tenure_years;

            if ($tenureYears <= 0) {
                DB::rollBack();
                return ApiResponse::error('Invalid tenure years', null, 422);
            }

            $totalMonths = $tenureYears * 12;
            $endDate = (clone $startDate)->addYears($tenureYears)->subDay();

            $application->update([
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'updated_by' => $request->updated_by,
                'updated_at' => now(),
                'is_active' => 1,
            ]);

            $monthlyAmount = (float) (
                $application->monthly_installment_amount
                ?? $application->installment_amount
                ?? $application->monthly_amount
                ?? $application->amount
                ?? $application->deposit_amount
                ?? 0
            );

            if ($monthlyAmount <= 0) {
                DB::rollBack();
                return ApiResponse::error(
                    'Installment amount not found for this application',
                    null,
                    422
                );
            }

            $shouldMarkFirstInstallmentPaid = $this->hasApprovedFirstOrApplyPaymentForApplication(
                (string) $application->application_no,
                (string) $application->member_id
            );

            $installments = [];
            $installmentDates = [];

            for ($i = 0; $i < $totalMonths; $i++) {
                $installmentDate = (clone $startDate)->addMonthsNoOverflow($i);

                $installments[] = [
                    'date' => $installmentDate->format('d-m-Y'),
                    'amount' => number_format($monthlyAmount, 2, '.', ''),
                    'status' => $i === 0 && $shouldMarkFirstInstallmentPaid ? 'paid' : 'pending',
                    'updated_by' => $request->updated_by ?? null,
                ];

                $installmentDates[] = $installmentDate->toDateString();
            }

            $existingDepositInstallment = DepositInstallment::where('application_no', $application->application_no)->first();
            $depositInstallmentStorageModel = $existingDepositInstallment ?: new DepositInstallment();

            $depositInstallmentData = [
                'member_id' => $application->member_id ?? null,
                'member_name' => $application->member_name
                    ?? $application->full_name
                    ?? null,
                'application_no' => $application->application_no ?? null,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'installment_json' => $this->formatInstallmentJsonForStorage($depositInstallmentStorageModel, $installments),
                'amount' => $monthlyAmount,
                'updated_by' => $request->updated_by,
                'updated_at' => now(),
            ];

            DepositInstallment::updateOrCreate(
                [
                    'application_no' => $application->application_no,
                ],
                $depositInstallmentData
            );

            if ($shouldMarkFirstInstallmentPaid) {
                $this->markFirstDepositInstallmentPaidForApplication(
                    (string) $application->application_no,
                    (string) ($request->updated_by ?? '')
                );
            }

            DB::commit();

            return ApiResponse::success(
                'Application start date, end date and installment schedule updated successfully',
                [
                    'application' => $application->fresh(),
                    'installment_summary' => [
                        'total_installments' => $totalMonths,
                        'monthly_amount' => number_format($monthlyAmount, 2, '.', ''),
                        'start_date' => $startDate->format('d-m-Y'),
                        'end_date' => $endDate->format('d-m-Y'),
                        'first_installment_date' => $installmentDates[0] ?? null,
                        'last_installment_date' => end($installmentDates) ?: null,
                    ],
                    'installments' => $installments,
                ]
            );
        } catch (\Throwable $e) {
            DB::rollBack();

            return ApiResponse::error(
                'Failed to update application and generate installments',
                [
                    'message' => $e->getMessage(),
                ],
                500
            );
        }
    }

    public function getDepositRenewalsApplications()
    {
        $renewalApplications = DepositRenewalApplication::query()
            ->leftJoin('members', 'deposit_renewal_applications.member_id', '=', 'members.member_id')
            ->where('deposit_renewal_applications.is_deleted', 0)
            ->orderBy('deposit_renewal_applications.id', 'desc')
            ->get([
                'deposit_renewal_applications.*',
                'members.member_id as member_id',
                'members.full_name as member_name',
            ]);

        if ($renewalApplications->isEmpty()) {
            return ApiResponse::success(
                'No deposit renewal applications found',
                []
            );
        }

        $renewalApplicationNos = $renewalApplications
            ->pluck('renewal_application_no')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        $installmentRows = DepositInstallment::query()
            ->whereIn('application_no', $renewalApplicationNos)
            ->get([
                'application_no',
                'installment_json',
            ])
            ->keyBy('application_no');

        $formattedRenewalApplications = $renewalApplications->map(function ($item) use ($installmentRows) {
            $installmentData = $installmentRows->get($item->renewal_application_no);

            $installmentJson = [];

            if ($installmentData && !empty($installmentData->installment_json)) {
                if (is_string($installmentData->installment_json)) {
                    $decoded = json_decode($installmentData->installment_json, true);
                    $installmentJson = is_array($decoded) ? $decoded : [];
                } elseif (is_array($installmentData->installment_json)) {
                    $installmentJson = $installmentData->installment_json;
                }
            }

            return [
                'id' => $item->id,
                'renewal_application_no' => $item->renewal_application_no,
                'deposit_application_id' => $item->deposit_application_id,
                'old_application_no' => $item->old_application_no,
                'member_id' => $item->member_id,
                'member_name' => $item->member_name,
                'scheme_id' => $item->scheme_id,
                'scheme_name' => $item->scheme_name,
                'current_deposit_amount' => $item->current_deposit_amount,
                'current_tenure_years' => $item->current_tenure_years,
                'requested_deposit_amount' => $item->requested_deposit_amount,
                'requested_tenure_years' => $item->requested_tenure_years,
                'tenure_extension_years' => $item->tenure_extension_years,
                'amount_change_type' => $item->amount_change_type,
                'amount_multiple' => $item->amount_multiple,
                'scheme_details' => $item->scheme_details,
                'investment_terms' => $item->investment_terms,
                'term_notes' => $item->term_notes,
                'status' => $item->status,
                'remark' => $item->remark,
                'updated_by' => $item->updated_by,
                'is_active' => $item->is_active,
                'is_deleted' => $item->is_deleted,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
                'installment_json' => $installmentJson,
            ];
        });

        return ApiResponse::success(
            'Deposit renewal applications fetched successfully',
            $formattedRenewalApplications,
            200
        );
    }

    public function getDepositeApplicationsInstallmets($oldApplicationId)
    {
        $oldApplicationId = trim((string) $oldApplicationId);

        if ($oldApplicationId === '') {
            return ApiResponse::error('Old application number is required.', [], 400);
        }

        $applicationinstallments = DepositInstallment::where('application_no', $oldApplicationId)
            ->orderBy('id', 'asc')
            ->get();

        if ($applicationinstallments->isEmpty()) {
            return ApiResponse::error('No installment found.', [], 404);
        }

        return ApiResponse::success(
            'Installments fetched successfully.',
            $applicationinstallments,
            200
        );
    }

    public function approveDepositRenewal(Request $request)
    {
        $validated = $request->validate([
            'renewal_application_no' => ['required', 'string'],
            'old_application_no' => ['required', 'string'],
            'member_id' => ['required', 'string'],
            'status' => ['required', 'string'],
        ]);

        $renewalApplicationNo = trim($validated['renewal_application_no']);
        $oldApplicationNo = trim($validated['old_application_no']);
        $memberId = trim($validated['member_id']);
        $renewalStatus = strtoupper(trim($validated['status']));

        $allowedRenewalStatuses = ['PENDING', 'REJECTED', 'APPROVED'];

        if (!in_array($renewalStatus, $allowedRenewalStatuses, true)) {
            return ApiResponse::error('Invalid renewal status provided.', [], 422);
        }

        $updatedBy = 'admin';
        if (function_exists('auth') && auth()->check()) {
            $updatedBy = auth()->user()->full_name ?? auth()->user()->name ?? 'admin';
        }

        DB::beginTransaction();

        try {
            $renewalApplication = DepositRenewalApplication::where('renewal_application_no', $renewalApplicationNo)
                ->where('old_application_no', $oldApplicationNo)
                ->where('member_id', $memberId)
                ->first();

            if (!$renewalApplication) {
                DB::rollBack();
                return ApiResponse::error('Renewal application not found.', [], 404);
            }

            $oldApplication = DepositApplication::where('application_no', $oldApplicationNo)
                ->where('member_id', $memberId)
                ->first();

            if (!$oldApplication) {
                DB::rollBack();
                return ApiResponse::error('Old deposit application not found.', [], 404);
            }

            if (empty($oldApplication->end_date)) {
                DB::rollBack();
                return ApiResponse::error('Old application end date is missing.', [], 400);
            }

            $requestedTenureYearsRaw = (string) $renewalApplication->requested_tenure_years;
            $requestedTenureYears = (int) filter_var($requestedTenureYearsRaw, FILTER_SANITIZE_NUMBER_INT);

            if ($requestedTenureYears <= 0) {
                DB::rollBack();
                return ApiResponse::error('Requested tenure years is invalid.', [], 400);
            }

            $requestedDepositAmount = (float) $renewalApplication->requested_deposit_amount;

            if ($requestedDepositAmount <= 0) {
                DB::rollBack();
                return ApiResponse::error('Requested deposit amount is invalid.', [], 400);
            }

            $oldEndDate = Carbon::parse($oldApplication->end_date);
            $newStartDate = $oldEndDate->copy()->addDay();
            $totalMonths = $requestedTenureYears * 12;
            $newEndDate = $newStartDate->copy()->addYears($requestedTenureYears)->subDay();

            $newApplicationNo = $renewalApplication->renewal_application_no;

            DepositApplication::create([
                'application_no' => $newApplicationNo,
                'application_type' => 'Renewal',
                'member_id' => $renewalApplication->member_id,
                'member_name' => $renewalApplication->member_name ?? $oldApplication->member_name,
                'member_email' => $oldApplication->member_email ?? null,
                'scheme_id' => $renewalApplication->scheme_id,
                'scheme_name' => $renewalApplication->scheme_name,
                'deposit_amount' => $requestedDepositAmount,
                'tenure_years' => $requestedTenureYears,
                'interest_rate' => $oldApplication->interest_rate ?? null,
                'start_date' => $newStartDate->format('Y-m-d'),
                'end_date' => $newEndDate->format('Y-m-d'),
                'status' => 'APPROVED',
                'is_active' => 1,
                'is_withdrawal' => 0,
                'is_renewed' => 1,
                'created_by' => $updatedBy,
                'updated_by' => $updatedBy,
            ]);

            $installmentJson = [];

            for ($i = 0; $i < $totalMonths; $i++) {
                $installmentDate = $newStartDate->copy()->addMonths($i);

                $installmentJson[] = [
                    'date' => $installmentDate->format('d-m-Y'),
                    'amount' => number_format($requestedDepositAmount, 2, '.', ''),
                    'status' => 'PENDING',
                    'updated_by' => $updatedBy,
                ];
            }

            $renewalInstallment = new DepositInstallment();

            DepositInstallment::create([
                'application_no' => $newApplicationNo,
                'member_id' => $renewalApplication->member_id,
                'member_name' => $renewalApplication->member_name ?? $oldApplication->member_name,
                'scheme_id' => $renewalApplication->scheme_id,
                'scheme_name' => $renewalApplication->scheme_name,
                'amount' => $requestedDepositAmount,
                'tenure_years' => $requestedTenureYears,
                'start_date' => $newStartDate->format('Y-m-d'),
                'end_date' => $newEndDate->format('Y-m-d'),
                'installment_json' => $this->formatInstallmentJsonForStorage($renewalInstallment, $installmentJson),
                'updated_by' => $updatedBy,
                'is_active' => 1,
                'is_deleted' => 0,
            ]);

            $renewalApplication->update([
                'status' => $renewalStatus,
                'updated_by' => $updatedBy,
                'is_active' => 1,
            ]);

            $oldApplication->update([
                'status' => 'WITHDRAW',
                'is_active' => 0,
                'is_renewed' => 1,
                'updated_by' => $updatedBy,
            ]);

            DB::commit();

            return ApiResponse::success('Deposit renewal approved successfully.', [
                'renewal_application_no' => $renewalApplicationNo,
                'old_application_no' => $oldApplicationNo,
                'new_application_no' => $newApplicationNo,
                'member_id' => $memberId,
                'new_start_date' => $newStartDate->format('Y-m-d'),
                'new_end_date' => $newEndDate->format('Y-m-d'),
                'total_installments' => $totalMonths,
                'installment_json' => $installmentJson,
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();

            return ApiResponse::error('Failed to approve renewal application.', [
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function getApplicationNoFromJsonRow(array $row): ?string
    {
        if (array_key_exists('application_no', $row)) {
            return (string) $row['application_no'];
        }

        if (array_key_exists('application no', $row)) {
            return (string) $row['application no'];
        }

        if (array_key_exists('applicationNo', $row)) {
            return (string) $row['applicationNo'];
        }

        return null;
    }

    private function getBooleanValueFromJsonRow(array $row, array $keys): bool
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $row)) {
                continue;
            }

            $value = $row[$key];

            if (is_bool($value)) {
                return $value;
            }

            if (is_numeric($value)) {
                return (int) $value === 1;
            }

            $normalized = strtolower(trim((string) $value));

            return in_array($normalized, ['true', '1', 'yes', 'paid', 'approved'], true);
        }

        return false;
    }

    private function getTitleFromJsonRow(array $row, string $fallbackTitle): string
    {
        if (array_key_exists('title', $row) && !empty(trim((string) $row['title']))) {
            return trim((string) $row['title']);
        }

        if (array_key_exists('scheme_name', $row) && !empty(trim((string) $row['scheme_name']))) {
            return trim((string) $row['scheme_name']);
        }

        if (array_key_exists('scheme name', $row) && !empty(trim((string) $row['scheme name']))) {
            return trim((string) $row['scheme name']);
        }

        return $fallbackTitle;
    }

    private function hasApprovedFirstOrApplyPaymentForApplication(string $applicationNo, string $memberId): bool
    {
        $applicationNo = trim($applicationNo);
        $memberId = trim($memberId);

        if ($applicationNo === '' || $memberId === '') {
            return false;
        }

        $accountManagementRecords = AccountManagement::where('member_id', $memberId)->get();

        foreach ($accountManagementRecords as $accountRecord) {
            $accountStatus = strtolower(trim((string) ($accountRecord->status ?? '')));

            if ($accountStatus !== 'approved') {
                continue;
            }

            $applicationsJson = $accountRecord->applications_json;

            if (is_string($applicationsJson)) {
                $decodedApplicationsJson = json_decode($applicationsJson, true);
                $applicationsJson = is_array($decodedApplicationsJson) ? $decodedApplicationsJson : [];
            }

            if (!is_array($applicationsJson) || empty($applicationsJson)) {
                continue;
            }

            foreach ($applicationsJson as $row) {
                if (!is_array($row)) {
                    continue;
                }

                $rowApplicationNo = $this->getApplicationNoFromJsonRow($row);
                $hasApplyPayment = $this->getBooleanValueFromJsonRow($row, [
                    'apply payment',
                    'apply_payment',
                    'applyPayment',
                ]);
                $hasFirstPayment = $this->getBooleanValueFromJsonRow($row, [
                    'first payment',
                    'first_payment',
                    'firstPayment',
                ]);

                if (trim((string) $rowApplicationNo) === $applicationNo && ($hasApplyPayment === true || $hasFirstPayment === true)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function markFirstDepositInstallmentPaidForApplication(string $applicationNo, string $updatedBy): void
    {
        $applicationNo = trim($applicationNo);

        if ($applicationNo === '') {
            return;
        }

        $depositInstallment = DepositInstallment::where('application_no', $applicationNo)->first();

        if (!$depositInstallment) {
            return;
        }

        $installmentJson = $depositInstallment->installment_json;

        if (is_string($installmentJson)) {
            $decodedInstallments = json_decode($installmentJson, true);
            $installmentJson = is_array($decodedInstallments) ? $decodedInstallments : [];
        }

        if (!is_array($installmentJson)) {
            $installmentJson = [];
        }

        if (!empty($installmentJson)) {
            foreach ($installmentJson as $index => $installment) {
                if (!is_array($installment)) {
                    continue;
                }

                $installmentJson[$index]['status'] = 'paid';
                $installmentJson[$index]['updated_by'] = $updatedBy;
                break;
            }
        }

        $depositInstallment->installment_json = $this->formatInstallmentJsonForStorage($depositInstallment, $installmentJson);
        $depositInstallment->updated_by = $updatedBy;
        $depositInstallment->updated_at = now();
        $depositInstallment->save();
    }

    private function formatInstallmentJsonForStorage(DepositInstallment $depositInstallment, array $installmentJson)
    {
        $casts = method_exists($depositInstallment, 'getCasts') ? $depositInstallment->getCasts() : [];
        $castType = isset($casts['installment_json']) ? strtolower((string) $casts['installment_json']) : '';

        if (in_array($castType, ['array', 'json', 'object', 'collection'], true)) {
            return $installmentJson;
        }

        return json_encode($installmentJson, JSON_UNESCAPED_UNICODE);
    }

    private function addDepositApplicationToTrialBalance(
        string $title,
        string $applicationNo,
        $date,
        float $amount,
        string $mode = 'online',
        string $createdBy = ''
    ): void {
        $transactionDate = Carbon::parse($date);
        $transactionMonth = (int) $transactionDate->format('n');
        $transactionYear = (int) $transactionDate->format('Y');

        if ($transactionMonth >= 4) {
            $financialYearStart = $transactionYear;
            $financialYearEnd = $transactionYear + 1;
        } else {
            $financialYearStart = $transactionYear - 1;
            $financialYearEnd = $transactionYear;
        }

        $financialYear = $financialYearStart . '-' . substr((string) $financialYearEnd, -2);

        $trialBalance = TrialBalance::where('financial_year', $financialYear)->first();

        if (!$trialBalance) {
            throw new \Exception('Trial balance record not found for financial year ' . $financialYear);
        }

        $creditJson = $trialBalance->credit_json;

        if (!is_array($creditJson)) {
            $decodedCreditJson = json_decode((string) $creditJson, true);
            $creditJson = is_array($decodedCreditJson) ? $decodedCreditJson : [];
        }

        $nextId = 1;

        if (!empty($creditJson)) {
            $existingIds = [];

            foreach ($creditJson as $creditItem) {
                if (is_array($creditItem) && isset($creditItem['id']) && is_numeric($creditItem['id'])) {
                    $existingIds[] = (int) $creditItem['id'];
                }
            }

            if (!empty($existingIds)) {
                $nextId = max($existingIds) + 1;
            }
        }

        $creditJson[] = [
            'id' => $nextId,
            'title' => $title,
            'application_no' => $applicationNo,
            'date' => $transactionDate->format('d-m-Y'),
            'amount' => (string) $amount,
            'mode' => $mode,
            'created_by' => $createdBy,
        ];

        $trialBalance->update([
            'credit_json' => $creditJson,
            'updated_by' => $createdBy,
            'updated_at' => now(),
        ]);
    }

    private function isOneTimeDepositScheme(?string $schemeName): bool
{
    $scheme = strtolower(trim((string) $schemeName));

    if ($scheme === '') {
        return false;
    }

    $normalized = preg_replace('/[^a-z0-9]+/', ' ', $scheme);
    $normalized = trim((string) preg_replace('/\s+/', ' ', (string) $normalized));

    $oneTimeSchemes = [
        'term deposit',
        'term deposite',
        'td',
        'fixed deposit',
        'fixed deposite',
        'fd',
        'dam duppat',
        'dam dupat',
        'damduppat',
        'dham duppat',
        'dham dupat',
    ];

    foreach ($oneTimeSchemes as $oneTimeScheme) {
        if ($normalized === $oneTimeScheme) {
            return true;
        }

        if (str_contains($normalized, $oneTimeScheme)) {
            return true;
        }
    }

    return false;
}

}