<?php

namespace App\Http\Controllers;

use App\Models\Dividend;
use App\Models\MemberShareCapital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
class DividantController extends Controller
{
    public function getAllDividants(Request $request): JsonResponse
    {
        $financialYear = trim((string) $request->query('financial_year', ''));

        $query = Dividend::query()
            ->where('is_deleted', 0)
            ->orderByDesc('id');

        if ($financialYear !== '') {
            $query->where('financial_year', $financialYear);
        }

        $dividants = $query->get();

        return response()->json([
            'success' => true,
            'message' => $dividants->isEmpty() ? 'No dividend records found' : 'Dividend records fetched successfully',
            'data' => $dividants,
        ], 200);
    }

    public function getAllMemberShareCapital()
    {
        $records = MemberShareCapital::query()
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => $records->isEmpty() ? 'No member share capital records found' : 'Member share capital records fetched successfully',
            'data' => $records,
        ], 200);
    }


    public function createDividantDeclaration(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'financial_year' => ['required', 'string', 'max:20'],
            'dividend_rate' => ['required', 'numeric', 'min:0.01'],
            'declared_date' => ['nullable', 'date'],
            'created_by' => ['nullable', 'string', 'max:100'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $financialYear = trim((string) $request->input('financial_year'));
        $dividendRate = (float) $request->input('dividend_rate');
        $declaredDate = $request->input('declared_date') ?: now()->toDateString();
        $createdBy = trim((string) $request->input('created_by', ''));
        $createdBy = $createdBy !== '' ? $createdBy : 'system';

        // $alreadyExists = Dividend::query()
        //     ->where('is_deleted', 0)
        //     ->where('financial_year', $financialYear)
        //     ->exists();

        // if ($alreadyExists) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Dividend declaration already exists for this financial year',
        //         'errors' => [
        //             'financial_year' => ['Dividend declaration already exists for this financial year'],
        //         ],
        //     ], 409);
        // }

        $memberShareCapitalQuery = MemberShareCapital::query();

        if (\Schema::hasColumn('member_share_capital', 'financial_year')) {
            $memberShareCapitalQuery->where('financial_year', $financialYear);
        }

        $memberShareCapitals = $memberShareCapitalQuery->get();

        if ($memberShareCapitals->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No member share capital records found for dividend declaration',
                'errors' => [
                    'financial_year' => ['No member share capital records found for the selected financial year'],
                ],
            ], 404);
        }

        $totalShareCapital = (float) $memberShareCapitals->sum(function ($item) {
            return (float) $item->share_capital_amount;
        });

        $totalPayout = round(($totalShareCapital * $dividendRate) / 100, 2);

        DB::beginTransaction();

        try {
            $dividend = Dividend::query()->create([
                'financial_year' => $financialYear,
                'dividend_rate' => $dividendRate,
                'total_payout' => $totalPayout,
                'declared_date' => $declaredDate,
                'created_by' => $createdBy,
                'created_at' => now(),
                'updated_by' => null,
                'updated_at' => null,
                'is_deleted' => 0,
                'deleted_by' => null,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Dividend declaration created successfully',
                'data' => $dividend,
            ], 201);
        } catch (\Throwable $th) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create dividend declaration',
                'errors' => [
                    'server' => [$th->getMessage()],
                ],
            ], 500);
        }
    }

}