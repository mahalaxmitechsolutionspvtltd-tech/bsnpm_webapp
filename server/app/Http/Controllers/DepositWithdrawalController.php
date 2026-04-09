<?php

namespace App\Http\Controllers;

use App\Models\DepositApplication;
use App\Models\DepositWithdrawal;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class DepositWithdrawalController extends Controller
{
    public function getWithdrawalRequests(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $status = strtoupper(trim((string) $request->query('status', '')));
        $perPage = (int) $request->query('per_page', 10);

        if ($perPage <= 0) {
            $perPage = 10;
        }

        if ($perPage > 100) {
            $perPage = 100;
        }

        $memberTable = (new Member())->getTable();
        $memberColumns = Schema::getColumnListing($memberTable);

        $possibleNameColumns = [
            'member_name',
            'name',
            'full_name',
            'member_full_name',
            'customer_name',
        ];

        $memberNameColumn = null;

        foreach ($possibleNameColumns as $column) {
            if (in_array($column, $memberColumns, true)) {
                $memberNameColumn = $column;
                break;
            }
        }

        $query = DepositWithdrawal::query()
            ->where('is_deleted', 0);

        if ($search !== '') {
            $matchingMemberIds = [];

            if ($memberNameColumn !== null) {
                $matchingMemberIds = Member::query()
                    ->where('member_id', 'like', '%' . $search . '%')
                    ->orWhere($memberNameColumn, 'like', '%' . $search . '%')
                    ->pluck('member_id')
                    ->filter()
                    ->values()
                    ->toArray();
            } else {
                $matchingMemberIds = Member::query()
                    ->where('member_id', 'like', '%' . $search . '%')
                    ->pluck('member_id')
                    ->filter()
                    ->values()
                    ->toArray();
            }

            $query->where(function ($q) use ($search, $matchingMemberIds) {
                $q->where('member_id', 'like', '%' . $search . '%')
                    ->orWhere('application_no', 'like', '%' . $search . '%')
                    ->orWhere('scheme_name', 'like', '%' . $search . '%')
                    ->orWhere('updated_by', 'like', '%' . $search . '%');

                if (!empty($matchingMemberIds)) {
                    $q->orWhereIn('member_id', $matchingMemberIds);
                }
            });
        }

        if ($status !== '' && in_array($status, DepositWithdrawal::statuses(), true)) {
            $query->where('status', $status);
        }

        $withdrawals = $query
            ->orderByDesc('id')
            ->paginate($perPage);

        $memberIds = collect($withdrawals->items())
            ->pluck('member_id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        $membersMap = [];

        if (!empty($memberIds)) {
            if ($memberNameColumn !== null) {
                $members = Member::query()
                    ->whereIn('member_id', $memberIds)
                    ->get(['member_id', $memberNameColumn]);

                foreach ($members as $member) {
                    $membersMap[$member->member_id] = $member->{$memberNameColumn};
                }
            } else {
                foreach ($memberIds as $memberId) {
                    $membersMap[$memberId] = null;
                }
            }
        }

        $withdrawals->getCollection()->transform(function ($withdrawal) use ($membersMap) {
            $withdrawal->member_name = $membersMap[$withdrawal->member_id] ?? null;
            return $withdrawal;
        });

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal requests fetched successfully',
            'data' => $withdrawals,
        ], 200);
    }

    public function approveWithdrawalRequest(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'updated_by' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $withdrawal = DepositWithdrawal::query()
            ->where('is_deleted', 0)
            ->find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request not found',
            ], 404);
        }

        if (strtoupper((string) $withdrawal->status) === 'APPROVED') {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request is already approved',
            ], 409);
        }

        if (strtoupper((string) $withdrawal->status) === 'REJECTED') {
            return response()->json([
                'success' => false,
                'message' => 'Rejected withdrawal request cannot be approved',
            ], 409);
        }

        $updatedBy = $request->input('updated_by');

        DB::beginTransaction();

        try {
            $depositApplication = DepositApplication::query()
                ->where('application_no', $withdrawal->application_no)
                ->first();

            if (!$depositApplication) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Deposit application not found for this withdrawal request',
                ], 404);
            }

            $withdrawal->status = 'APPROVED';
            $withdrawal->updated_by = $updatedBy;
            $withdrawal->save();

            $depositApplication->is_active = 0;
            $depositApplication->is_withdrawal = 1;
            $depositApplication->updated_by = $updatedBy;
            $depositApplication->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request approved successfully',
                'data' => [
                    'withdrawal' => $withdrawal->fresh(),
                    'deposit_application' => $depositApplication->fresh(),
                ],
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to approve withdrawal request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function rejectWithdrawalRequest(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'updated_by' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $withdrawal = DepositWithdrawal::query()
            ->where('is_deleted', 0)
            ->find($id);

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request not found',
            ], 404);
        }

        if (strtoupper((string) $withdrawal->status) === 'REJECTED') {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request is already rejected',
            ], 409);
        }

        if (strtoupper((string) $withdrawal->status) === 'APPROVED') {
            return response()->json([
                'success' => false,
                'message' => 'Approved withdrawal request cannot be rejected',
            ], 409);
        }

        $withdrawal->status = 'REJECTED';
        $withdrawal->updated_by = $request->input('updated_by');
        $withdrawal->save();

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal request rejected successfully',
            'data' => $withdrawal->fresh(),
        ], 200);
    }
}