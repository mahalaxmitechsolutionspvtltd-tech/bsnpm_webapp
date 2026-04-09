<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\AccountManagement;
use App\Models\Member;
use App\Models\MemberEmergencyFund;
use App\Models\MemberJoiningFee;
use App\Models\MemberShareCapital;

use App\Models\TrialBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class MemberController extends Controller
{
    public function getMembers()
    {
        $members = Member::with('nominees')
            ->where('is_deleted', 0)
            ->get();

        return ApiResponse::success('Members fetched successfully', $members);
    }
    public function createMembers(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:members,email'],
            'mobile_number' => ['nullable', 'string', 'max:20', 'unique:members,mobile_number'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other', 'Male', 'Female', 'Other'])],
            'status' => ['nullable', Rule::in(['active', 'defaulter', 'resigned'])],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'created_by' => ['nullable', 'string', 'max:100'],
            'share_capital' => ['nullable', Rule::in(['yes', 'no'])],
            'emergancy_fund' => ['nullable', Rule::in(['yes', 'no'])],
            'share_capital_amount' => ['nullable', 'numeric', 'min:500'],
            'emergancy_fund_amount' => ['nullable', 'numeric', 'min:20'],
        ]);

        // Validation for multiples
        if (($validated['share_capital'] ?? null) === 'yes') {
            if (!isset($validated['share_capital_amount']) || fmod((float) $validated['share_capital_amount'], 500) != 0.0) {
                return ApiResponse::error('Validation failed', [
                    'share_capital_amount' => ['Share capital amount must be in multiples of 500.'],
                ], 422);
            }
        }

        if (($validated['emergancy_fund'] ?? null) === 'yes') {
            if (!isset($validated['emergancy_fund_amount']) || fmod((float) $validated['emergancy_fund_amount'], 20) != 0.0) {
                return ApiResponse::error('Validation failed', [
                    'emergancy_fund_amount' => ['Emergency fund amount must be in multiples of 20.'],
                ], 422);
            }
        }

        DB::beginTransaction();

        try {
            $createdBy = $validated['created_by'] ?? $request->input('created_by') ?? null;
            $formattedGender = !empty($validated['gender']) ? ucfirst(strtolower($validated['gender'])) : null;

            // 1. Create Member
            $member = Member::create([
                'full_name' => $validated['full_name'],
                'email' => $validated['email'] ?? null,
                'mobile_number' => $validated['mobile_number'] ?? null,
                'gender' => $formattedGender,
                'status' => $validated['status'] ?? 'active',
                'password' => Hash::make($validated['password']),
                'created_by' => $createdBy,
            ]);

            $joiningFeeDate = now();
            $joiningFeeAmount = 100.00;

            // 2. Add Member Joining Fee record
            MemberJoiningFee::create([
                'member_id' => $member->member_id,
                'member_name' => $member->full_name,
                'joining_fee_amount' => $joiningFeeAmount,
                'last_payment_date' => $joiningFeeDate->toDateString(),
                'updated_by' => $createdBy,
                'updated_at' => now(),
            ]);

            // 3. Trial Balance Logic
            if ((int) $joiningFeeDate->format('n') >= 4) {
                $startYear = (int) $joiningFeeDate->format('Y');
                $endYear = $startYear + 1;
            } else {
                $startYear = (int) $joiningFeeDate->format('Y') - 1;
                $endYear = (int) $joiningFeeDate->format('Y');
            }
            $financialYear = $startYear . '-' . substr((string) $endYear, -2);

            $trialBalance = TrialBalance::where('financial_year', $financialYear)->first();

            if (!$trialBalance) {
                $trialBalance = TrialBalance::create([
                    'financial_year' => $financialYear,
                    'opening_balance' => 0,
                    'cash_in_hand' => 0,
                    'bank_balance' => 0,
                    'closing_balance' => 0,
                    'debit_json' => [],
                    'credit_json' => [],
                    'created_by' => $createdBy,
                    'created_at' => now(),
                    'updated_by' => $createdBy,
                    'updated_at' => now(),
                ]);
            }

            // Fix for json_decode issue
            $creditJson = $trialBalance->credit_json;
            if (!is_array($creditJson)) {
                $creditJson = json_decode((string) $creditJson, true) ?: [];
            }

            $nextCreditId = 1;
            if (!empty($creditJson)) {
                $ids = array_column($creditJson, 'id');
                $nextCreditId = max($ids) + 1;
            }

            // Joining Fee — Trial Balance credit entry
            $creditJson[] = [
                'id' => $nextCreditId,
                'title' => 'member joining fee',
                'date' => $joiningFeeDate->format('d-m-Y'),
                'amount' => $joiningFeeAmount,
                'mode' => 'online',
                'created_by' => $createdBy,
            ];
            $nextCreditId++;

            // 4. Account Management — $applications array
            $applications = [];

            // ✅ Joining Fee — FIRST entry
            array_push($applications, [
                'title' => 'member joining fee',
                'date' => $joiningFeeDate->toDateString(),
                'amount' => (float) $joiningFeeAmount,
                'member_name' => $member->full_name,
                'application_no' => null,
            ]);

            $totalAmount = (float) $joiningFeeAmount;

            // ✅ Share Capital
            if (($validated['share_capital'] ?? null) === 'yes' && !empty($validated['share_capital_amount'])) {
                MemberShareCapital::create([
                    'member_id' => $member->member_id,
                    'member_name' => $member->full_name,
                    'share_capital_amount' => (float) $validated['share_capital_amount'],
                    'last_payment_date' => now()->toDateString(),
                    'updated_by' => $createdBy,
                    'updated_at' => now(),
                ]);

                array_push($applications, [
                    'title' => 'Share Capital',
                    'date' => now()->toDateString(),
                    'amount' => (float) $validated['share_capital_amount'],
                    'member_name' => $member->full_name,
                    'application_no' => null,
                ]);

                $totalAmount += (float) $validated['share_capital_amount'];

                // Share Capital — Trial Balance credit entry
                $creditJson[] = [
                    'id' => $nextCreditId,
                    'title' => 'share capital',
                    'date' => now()->format('d-m-Y'),
                    'amount' => (float) $validated['share_capital_amount'],
                    'mode' => 'online',
                    'created_by' => $createdBy,
                ];
                $nextCreditId++;
            }

            // ✅ Emergency Fund
            if (($validated['emergancy_fund'] ?? null) === 'yes' && !empty($validated['emergancy_fund_amount'])) {
                MemberEmergencyFund::create([
                    'member_id' => $member->member_id,
                    'member_name' => $member->full_name,
                    'emergency_fund_amount' => (float) $validated['emergancy_fund_amount'],
                    'last_payment_date' => now()->toDateString(),
                    'updated_by' => $createdBy,
                    'updated_at' => now(),
                ]);

                array_push($applications, [
                    'title' => 'Emergency Fund',
                    'date' => now()->toDateString(),
                    'amount' => (float) $validated['emergancy_fund_amount'],
                    'member_name' => $member->full_name,
                    'application_no' => null,
                ]);

                $totalAmount += (float) $validated['emergancy_fund_amount'];

                // Emergency Fund — Trial Balance credit entry
                $creditJson[] = [
                    'id' => $nextCreditId,
                    'title' => 'emergency fund',
                    'date' => now()->format('d-m-Y'),
                    'amount' => (float) $validated['emergancy_fund_amount'],
                    'mode' => 'online',
                    'created_by' => $createdBy,
                ];
                $nextCreditId++;
            }

            // ✅ Trial Balance — एकदाच update (सगळ्या entries नंतर)
            $trialBalance->update([
                'credit_json' => $creditJson,
                'updated_by' => $createdBy,
                'updated_at' => now(),
            ]);

            // ✅ Debug log — joining fee आहे का confirm करा
            \Log::info('Applications before save:', $applications);

            // ✅ Account Management — array directly (Model cast handle करेल)
            AccountManagement::create([
                'member_id' => $member->member_id,
                'member_name' => $member->full_name,
                'date_of_payment' => now()->toDateString(),
                'applications_json' => $applications,
                'total_amount' => $totalAmount,
                'payment_mode' => 'Cash (Already Paid)',
                'proof_file' => null,
                'reference_trn' => 'CASH_PAID',
                'remark' => null,
                'status' => 'Approved',
                'created_by' => $createdBy,
                'created_at' => now(),
                'updated_by' => $createdBy,
                'updated_at' => now(),
            ]);

            DB::commit();

            return ApiResponse::success('Member created successfully', [
                'member' => $member,
                'applications_json' => $applications,
            ], 201);

        } catch (\Throwable $th) {
            DB::rollBack();
            return ApiResponse::error('Failed to create member', [
                'server' => [$th->getMessage()],
            ], 500);
        }
    }

    private function getFinancialYear($date): string
    {
        $date = \Carbon\Carbon::parse($date);

        if ((int) $date->format('n') >= 4) {
            $startYear = (int) $date->format('Y');
            $endYear = $startYear + 1;
        } else {
            $startYear = (int) $date->format('Y') - 1;
            $endYear = (int) $date->format('Y');
        }

        return $startYear . '-' . substr((string) $endYear, -2);
    }
    public function updateStatus(Request $request, $member_id)
    {
        if (!$member_id) {
            return ApiResponse::error("No member id found.", null, 405);
        }
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'defaulter', 'resigned', 'deactive'])],
            'updated_by' => ['nullable', 'string', 'max:100'],
        ]);

        $member = Member::where('member_id', $member_id)->first();

        if (!$member) {
            return ApiResponse::error("Member not found.", null, 404);
        }

        $member->status = $validated['status'];
        $member->updated_by = $validated['updated_by'] ?? null;
        $member->updated_at = now();
        $member->save();
        return ApiResponse::success("Member status updated successfully.", $member, 200);
    }



}