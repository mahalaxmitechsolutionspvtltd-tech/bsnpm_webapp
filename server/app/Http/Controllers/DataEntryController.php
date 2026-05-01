<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\DataEntry;
use App\Models\TrialBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DataEntryController extends Controller
{
    public function getDataEntry()
    {
        $dataEntries = DataEntry::query()
            ->where('is_deleted', 0)
            ->orderByDesc('id')
            ->get();

        return ApiResponse::success(
            'Data entry fetched successfully',
            $dataEntries
        );
    }

    public function addDataEntry(Request $request)
    {
        $validated = $request->validate([
            'entry_type' => ['required', 'string', 'max:30'],
            'date' => ['nullable', 'date'],
            'category' => ['nullable', 'string', 'max:100'],
            'payment_mode' => ['nullable', 'string', 'max:30'],
            'amount' => ['nullable', 'numeric'],
            'reference' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'created_by' => ['nullable', 'string', 'max:100'],
        ]);

        DB::beginTransaction();

        try {
            $entryType = strtolower(trim($validated['entry_type']));
            $prefix = $entryType === 'expense' ? 'EXP' : 'INC';

            $lastEntry = DataEntry::query()
                ->where('entry_type', $entryType)
                ->whereNotNull('voucher_no')
                ->orderByDesc('id')
                ->first();

            $nextNumber = 1;

            if ($lastEntry && !empty($lastEntry->voucher_no)) {
                $lastNumber = (int) preg_replace('/[^0-9]/', '', $lastEntry->voucher_no);
                $nextNumber = $lastNumber + 1;
            }

            $voucherNo = $prefix . '-' . str_pad((string) $nextNumber, 6, '0', STR_PAD_LEFT);

            $dataEntry = DataEntry::create([
                'voucher_no' => $voucherNo,
                'entry_type' => $entryType,
                'date' => $validated['date'] ?? null,
                'category' => $validated['category'] ?? null,
                'payment_mode' => $validated['payment_mode'] ?? null,
                'amount' => $validated['amount'] ?? null,
                'reference' => $validated['reference'] ?? null,
                'description' => $validated['description'] ?? null,
                'created_by' => $validated['created_by'] ?? null,
                'created_at' => now(),
                'updated_by' => null,
                'updated_at' => null,
                'is_deleted' => 0,
                'deleted_by' => null,
            ]);

            $entryDateForTrialBalance = $validated['date'] ?? now()->toDateString();
            $entryTimestamp = strtotime((string) $entryDateForTrialBalance);

            if ($entryTimestamp === false) {
                $entryTimestamp = time();
            }

            $entryMonth = (int) date('n', $entryTimestamp);
            $entryYear = (int) date('Y', $entryTimestamp);

            if ($entryMonth >= 4) {
                $financialYearStart = $entryYear;
                $financialYearEnd = $entryYear + 1;
            } else {
                $financialYearStart = $entryYear - 1;
                $financialYearEnd = $entryYear;
            }

            $financialYear = $financialYearStart . '-' . substr((string) $financialYearEnd, -2);

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
                    'created_by' => $validated['created_by'] ?? null,
                    'created_at' => now(),
                    'updated_by' => $validated['created_by'] ?? null,
                    'updated_at' => now(),
                ]);
            }

            $debitJson = $trialBalance->debit_json;
            $creditJson = $trialBalance->credit_json;

            if (!is_array($debitJson)) {
                $decodedDebitJson = json_decode((string) $debitJson, true);
                $debitJson = is_array($decodedDebitJson) ? $decodedDebitJson : [];
            }

            if (!is_array($creditJson)) {
                $decodedCreditJson = json_decode((string) $creditJson, true);
                $creditJson = is_array($decodedCreditJson) ? $decodedCreditJson : [];
            }

            $targetJson = $entryType === 'expense' ? $creditJson : $debitJson;

            $nextJsonId = 1;

            if (!empty($targetJson)) {
                $ids = array_map(function ($item) {
                    return (int) ($item['id'] ?? 0);
                }, $targetJson);

                $nextJsonId = max($ids) + 1;
            }

            $trialBalanceEntry = [
                'id' => $nextJsonId,
                'title' => trim((string) ($validated['category'] ?? '')) !== ''
                    ? trim((string) $validated['category'])
                    : ucfirst($entryType),
                'application_no' => $voucherNo,
                'date' => date('d-m-Y', $entryTimestamp),
                'amount' => (float) ($validated['amount'] ?? 0),
                'mode' => trim((string) ($validated['payment_mode'] ?? '')),
                'created_by' => $validated['created_by'] ?? null,
            ];

            if ($entryType === 'expense') {
                $creditJson[] = $trialBalanceEntry;
                $trialBalance->credit_json = $creditJson;
            } else {
                $debitJson[] = $trialBalanceEntry;
                $trialBalance->debit_json = $debitJson;
            }

            $trialBalance->updated_by = $validated['created_by'] ?? null;
            $trialBalance->updated_at = now();
            $trialBalance->save();

            DB::commit();

            return ApiResponse::success(
                'Data entry added successfully',
                $dataEntry
            );
        } catch (\Throwable $e) {
            DB::rollBack();

            return ApiResponse::error(
                'Failed to add data entry',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    public function updateDataEntry(Request $request, int $id)
    {
        $validated = $request->validate([
            'entry_type' => ['required', 'string', 'max:30'],
            'date' => ['nullable', 'date'],
            'category' => ['nullable', 'string', 'max:100'],
            'payment_mode' => ['nullable', 'string', 'max:30'],
            'amount' => ['nullable', 'numeric'],
            'reference' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'updated_by' => ['nullable', 'string', 'max:100'],
        ]);

        $dataEntry = DataEntry::query()
            ->where('is_deleted', 0)
            ->find($id);

        if (!$dataEntry) {
            return ApiResponse::error(
                'Data entry not found',
                ['id' => ['Invalid data entry id']],
                404
            );
        }

        $entryType = strtolower(trim($validated['entry_type']));

        $dataEntry->update([
            'entry_type' => $entryType,
            'date' => $validated['date'] ?? null,
            'category' => $validated['category'] ?? null,
            'payment_mode' => $validated['payment_mode'] ?? null,
            'amount' => $validated['amount'] ?? null,
            'reference' => $validated['reference'] ?? null,
            'description' => $validated['description'] ?? null,
            'updated_by' => $validated['updated_by'] ?? null,
            'updated_at' => now(),
        ]);

        return ApiResponse::success(
            'Data entry updated successfully',
            $dataEntry->fresh()
        );
    }
}