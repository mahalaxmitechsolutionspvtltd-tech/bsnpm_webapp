<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\DataEntry;
use Illuminate\Http\Request;

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

        return ApiResponse::success(
            'Data entry added successfully',
            $dataEntry
        );
    }

    // update contorller

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
