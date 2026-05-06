<?php

namespace App\Http\Controllers;

use App\Models\ReserveFund;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ReserveFundController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'transaction_type' => ['nullable', Rule::in(['credit', 'debit'])],
            'payment_mode' => ['nullable', Rule::in(['cash', 'bank', 'upi', 'cheque', 'online', 'other'])],
            'financial_year' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'cancelled'])],
            'fund_date_from' => ['nullable', 'date'],
            'fund_date_to' => ['nullable', 'date', 'after_or_equal:fund_date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['nullable', Rule::in(['id', 'reserve_fund_id', 'title', 'category', 'amount', 'transaction_type', 'payment_mode', 'fund_date', 'financial_year', 'status', 'created_at', 'updated_at', 'is_deleted'])],
            'sort_order' => ['nullable', Rule::in(['asc', 'desc'])],
            
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $perPage = (int) $request->input('per_page', 10);
        $sortBy = $request->input('sort_by', 'id');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = ReserveFund::query();

        if ($request->boolean('only_deleted')) {
            $query->where('is_deleted', 1);
        } 
        $query->search($request->input('search'));

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('transaction_type')) {
            $query->where('transaction_type', $request->input('transaction_type'));
        }

        if ($request->filled('payment_mode')) {
            $query->where('payment_mode', $request->input('payment_mode'));
        }

        if ($request->filled('financial_year')) {
            $query->where('financial_year', $request->input('financial_year'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('fund_date_from')) {
            $query->whereDate('fund_date', '>=', $request->input('fund_date_from'));
        }

        if ($request->filled('fund_date_to')) {
            $query->whereDate('fund_date', '<=', $request->input('fund_date_to'));
        }

        $reserveFunds = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'message' => 'Reserve funds fetched successfully',
            'data' => $reserveFunds,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reserve_fund_id' => ['nullable', 'string', 'max:50', 'unique:reserve_funds,reserve_fund_id'],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'transaction_type' => ['required', Rule::in(['credit', 'debit'])],
            'payment_mode' => ['nullable', Rule::in(['cash', 'bank', 'upi', 'cheque', 'online', 'other'])],
            'reference_no' => ['nullable', 'string', 'max:150'],
            'fund_date' => ['required', 'date'],
            'financial_year' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'cancelled'])],
            'remark' => ['nullable', 'string'],
            'created_by' => ['nullable', 'string', 'max:150'],
            'updated_by' => ['nullable', 'string', 'max:150'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $reserveFund = ReserveFund::create([
            'reserve_fund_id' => $validated['reserve_fund_id'] ?? null,
            'title' => trim($validated['title']),
            'category' => isset($validated['category']) ? trim($validated['category']) : null,
            'amount' => $validated['amount'],
            'transaction_type' => $validated['transaction_type'],
            'payment_mode' => $validated['payment_mode'] ?? null,
            'reference_no' => isset($validated['reference_no']) ? trim($validated['reference_no']) : null,
            'fund_date' => $validated['fund_date'],
            'financial_year' => $validated['financial_year'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'remark' => $validated['remark'] ?? null,
            'created_by' => $validated['created_by'] ?? $this->getRequestUserName($request),
            'updated_by' => $validated['updated_by'] ?? null,
            'is_deleted' => 0,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Reserve fund created successfully',
            'data' => $reserveFund->fresh(),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $reserveFund = ReserveFund::query()
            ->where('is_deleted', 0)
            ->where(function ($query) use ($id) {
                $query->where('id', $id)
                    ->orWhere('reserve_fund_id', $id);
            })
            ->first();

        if (!$reserveFund) {
            return response()->json([
                'status' => 'error',
                'message' => 'Reserve fund not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Reserve fund fetched successfully',
            'data' => $reserveFund,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $reserveFund = ReserveFund::query()
            ->where('is_deleted', 0)
            ->where(function ($query) use ($id) {
                $query->where('id', $id)
                    ->orWhere('reserve_fund_id', $id);
            })
            ->first();

        if (!$reserveFund) {
            return response()->json([
                'status' => 'error',
                'message' => 'Reserve fund not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'reserve_fund_id' => ['nullable', 'string', 'max:50', Rule::unique('reserve_funds', 'reserve_fund_id')->ignore($reserveFund->id)],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'transaction_type' => ['required', Rule::in(['credit', 'debit'])],
            'payment_mode' => ['nullable', Rule::in(['cash', 'bank', 'upi', 'cheque', 'online', 'other'])],
            'reference_no' => ['nullable', 'string', 'max:150'],
            'fund_date' => ['required', 'date'],
            'financial_year' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'cancelled'])],
            'remark' => ['nullable', 'string'],
            'updated_by' => ['nullable', 'string', 'max:150'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $reserveFund->update([
            'reserve_fund_id' => $validated['reserve_fund_id'] ?? $reserveFund->reserve_fund_id,
            'title' => trim($validated['title']),
            'category' => isset($validated['category']) ? trim($validated['category']) : null,
            'amount' => $validated['amount'],
            'transaction_type' => $validated['transaction_type'],
            'payment_mode' => $validated['payment_mode'] ?? null,
            'reference_no' => isset($validated['reference_no']) ? trim($validated['reference_no']) : null,
            'fund_date' => $validated['fund_date'],
            'financial_year' => $validated['financial_year'] ?? null,
            'status' => $validated['status'] ?? $reserveFund->status,
            'remark' => $validated['remark'] ?? null,
            'updated_by' => $validated['updated_by'] ?? $this->getRequestUserName($request),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Reserve fund updated successfully',
            'data' => $reserveFund->fresh(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $reserveFund = ReserveFund::query()
            ->where('is_deleted', 0)
            ->where(function ($query) use ($id) {
                $query->where('id', $id)
                    ->orWhere('reserve_fund_id', $id);
            })
            ->first();

        if (!$reserveFund) {
            return response()->json([
                'status' => 'error',
                'message' => 'Reserve fund not found',
            ], 404);
        }

        $reserveFund->update([
            'is_deleted' => 1,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Reserve fund deleted successfully',
        ]);
    }

    public function restore(string $id): JsonResponse
    {
        $reserveFund = ReserveFund::query()
            ->where('is_deleted', 1)
            ->where(function ($query) use ($id) {
                $query->where('id', $id)
                    ->orWhere('reserve_fund_id', $id);
            })
            ->first();

        if (!$reserveFund) {
            return response()->json([
                'status' => 'error',
                'message' => 'Deleted reserve fund not found',
            ], 404);
        }

        $reserveFund->update([
            'is_deleted' => 0,
            'deleted_by' => null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Reserve fund restored successfully',
            'data' => $reserveFund->fresh(),
        ]);
    }

    public function forceDelete(string $id): JsonResponse
    {
        $reserveFund = ReserveFund::query()
            ->where('is_deleted', 1)
            ->where(function ($query) use ($id) {
                $query->where('id', $id)
                    ->orWhere('reserve_fund_id', $id);
            })
            ->first();

        if (!$reserveFund) {
            return response()->json([
                'status' => 'error',
                'message' => 'Deleted reserve fund not found',
            ], 404);
        }

        $reserveFund->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Reserve fund permanently deleted successfully',
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'financial_year' => ['nullable', 'string', 'max:20'],
            'fund_date_from' => ['nullable', 'date'],
            'fund_date_to' => ['nullable', 'date', 'after_or_equal:fund_date_from'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'cancelled'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $query = ReserveFund::query()->where('is_deleted', 0);

        if ($request->filled('financial_year')) {
            $query->where('financial_year', $request->input('financial_year'));
        }

        if ($request->filled('fund_date_from')) {
            $query->whereDate('fund_date', '>=', $request->input('fund_date_from'));
        }

        if ($request->filled('fund_date_to')) {
            $query->whereDate('fund_date', '<=', $request->input('fund_date_to'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $totalCredit = (clone $query)->where('transaction_type', 'credit')->sum('amount');
        $totalDebit = (clone $query)->where('transaction_type', 'debit')->sum('amount');
        $activeFunds = (clone $query)->where('status', 'active')->count();
        $inactiveFunds = (clone $query)->where('status', 'inactive')->count();
        $cancelledFunds = (clone $query)->where('status', 'cancelled')->count();

        return response()->json([
            'status' => 'success',
            'message' => 'Reserve fund summary fetched successfully',
            'data' => [
                'total_credit' => round((float) $totalCredit, 2),
                'total_debit' => round((float) $totalDebit, 2),
                'available_balance' => round((float) $totalCredit - (float) $totalDebit, 2),
                'active_funds' => $activeFunds,
                'inactive_funds' => $inactiveFunds,
                'cancelled_funds' => $cancelledFunds,
                'total_records' => $activeFunds + $inactiveFunds + $cancelledFunds,
            ],
        ]);
    }

    private function getRequestUserName(Request $request): ?string
    {
        if ($request->user()) {
            return $request->user()->admin_name
                ?? $request->user()->full_name
                ?? $request->user()->name
                ?? $request->user()->email
                ?? null;
        }

        return $request->input('user_name')
            ?? $request->input('created_by')
            ?? $request->input('updated_by')
            ?? $request->input('deleted_by')
            ?? null;
    }
}