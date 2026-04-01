<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\AccountManagement;
use App\Models\Member;
use App\Models\MemberEmergencyFund;
use App\Models\MemberJoiningFee;
use App\Models\MemberShareCapital;
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

        if (($validated['share_capital'] ?? null) === 'yes') {
            if (!isset($validated['share_capital_amount'])) {
                return ApiResponse::error('Validation failed', [
                    'share_capital_amount' => ['Share capital amount is required.'],
                ], 422);
            }

            if (fmod((float) $validated['share_capital_amount'], 500) != 0.0) {
                return ApiResponse::error('Validation failed', [
                    'share_capital_amount' => ['Share capital amount must be in multiples of 500.'],
                ], 422);
            }
        }

        if (($validated['emergancy_fund'] ?? null) === 'yes') {
            if (!isset($validated['emergancy_fund_amount'])) {
                return ApiResponse::error('Validation failed', [
                    'emergancy_fund_amount' => ['Emergency fund amount is required.'],
                ], 422);
            }

            if (fmod((float) $validated['emergancy_fund_amount'], 20) != 0.0) {
                return ApiResponse::error('Validation failed', [
                    'emergancy_fund_amount' => ['Emergency fund amount must be in multiples of 20.'],
                ], 422);
            }
        }

        DB::beginTransaction();

        try {
            $createdBy = $validated['created_by'] ?? $request->input('created_by') ?? null;

            $formattedGender = null;
            if (!empty($validated['gender'])) {
                $formattedGender = ucfirst(strtolower($validated['gender']));
            }

            $member = Member::create([
                'full_name' => $validated['full_name'],
                'email' => $validated['email'] ?? null,
                'mobile_number' => $validated['mobile_number'] ?? null,
                'gender' => $formattedGender,
                'status' => $validated['status'] ?? 'active',
                'password' => Hash::make($validated['password']),
                'created_by' => $createdBy,
            ]);

            MemberJoiningFee::create([
                'member_id' => $member->member_id,
                'member_name' => $member->full_name,
                'joining_fee_amount' => 100.00,
                'last_payment_date' => now()->toDateString(),
                'updated_by' => $createdBy,
                'updated_at' => now(),
            ]);

            $applications = [];
            $totalAmount = 0.00;

            if (($validated['share_capital'] ?? null) === 'yes' && !empty($validated['share_capital_amount'])) {
                MemberShareCapital::create([
                    'member_id' => $member->member_id,
                    'member_name' => $member->full_name,
                    'share_capital_amount' => (float) $validated['share_capital_amount'],
                    'last_payment_date' => now()->toDateString(),
                    'updated_by' => $createdBy,
                    'updated_at' => now(),
                ]);

                $applications[] = [
                    'title' => 'Share Capital',
                    'date' => now()->toDateString(),
                    'amount' => (float) $validated['share_capital_amount'],
                    'member name' => $member->full_name,
                    'application no' => null,
                ];

                $totalAmount += (float) $validated['share_capital_amount'];
            }

            if (($validated['emergancy_fund'] ?? null) === 'yes' && !empty($validated['emergancy_fund_amount'])) {
                MemberEmergencyFund::create([
                    'member_id' => $member->member_id,
                    'member_name' => $member->full_name,
                    'emergency_fund_amount' => (float) $validated['emergancy_fund_amount'],
                    'last_payment_date' => now()->toDateString(),
                    'updated_by' => $createdBy,
                    'updated_at' => now(),
                ]);

                $applications[] = [
                    'title' => 'Emergency Fund',
                    'date' => now()->toDateString(),
                    'amount' => (float) $validated['emergancy_fund_amount'],
                    'member name' => $member->full_name,
                    'application no' => null,
                ];

                $totalAmount += (float) $validated['emergancy_fund_amount'];
            }

            if (!empty($applications)) {
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
            }

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