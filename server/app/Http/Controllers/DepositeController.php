<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\AccountManagement;
use App\Models\DepositApplication;
use App\Models\DepositInstallment;
use App\Models\DepositRenewalApplication;
use App\Models\DepositScheme;
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

    // get deposite apllication
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

            $finalData = $applications->map(function ($application) use ($accountManagementRows) {

                $memberAccounts = $accountManagementRows->get($application->member_id, collect());

                $matchedApplicationJson = null;
                $matchedAccountRow = null;

                foreach ($memberAccounts as $accountRow) {
                    $applicationsJson = $accountRow->applications_json;

                    if (!is_array($applicationsJson)) {
                        continue;
                    }

                    foreach ($applicationsJson as $jsonItem) {
                        if (
                            is_array($jsonItem) &&
                            isset($jsonItem['application no']) &&
                            trim((string) $jsonItem['application no']) === trim((string) $application->application_no)
                        ) {
                            // First match घे (backup म्हणून)
                            if ($matchedAccountRow === null) {
                                $matchedApplicationJson = $jsonItem;
                                $matchedAccountRow = $accountRow;
                            }

                            // proof_file असलेला row मिळाला तर override कर आणि थांब
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
                        'proof_file' => $matchedAccountRow->proof_file,
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

        $updateData = [
            'status' => $request->status,
            'updated_by' => $request->updated_by,
            'updated_at' => now(),
        ];

        if ($request->status === 'withdrawn') {
            $updateData['is_withdrawal'] = 1;
            $updateData['is_active'] = 0;
        }

        if (in_array($request->status, ['active', 'inprogress'])) {
            $updateData['is_active'] = 1;
        }

        if (in_array($request->status, ['rejected', 'closed', 'completed'])) {
            $updateData['is_active'] = 0;
        }

        $application->update($updateData);

        return ApiResponse::success(
            'Application status updated successfully',
            $application->fresh()
        );
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

        if ($application->status !== 'APPROVED') {
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

            $installments = [];
            $installmentDates = [];

            for ($i = 0; $i < $totalMonths; $i++) {
                $installmentDate = (clone $startDate)->addMonthsNoOverflow($i);

                $installments[] = [
                    'date' => $installmentDate->format('d-m-Y'),
                    'amount' => number_format($monthlyAmount, 2, '.', ''),
                    'status' => 'pending',
                    'updated_by' => $request->updated_by ?? null,
                ];

                $installmentDates[] = $installmentDate->toDateString();
            }

            $depositInstallmentData = [
                'member_id' => $application->member_id ?? null,
                'member_name' => $application->member_name
                    ?? $application->full_name
                    ?? null,
                'application_no' => $application->application_no ?? null,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'installment_json' => $installments,
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
                'installment_json' => json_encode($installmentJson),
                'status' => 'PENDING',
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
}