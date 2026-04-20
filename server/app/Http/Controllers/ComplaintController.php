<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ComplaintController extends Controller
{
    public function getComplaints(Request $request): JsonResponse
    {
        $query = Complaint::query()
            ->where('is_deleted', 0);

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));

            $query->where(function ($q) use ($search) {
                $q->where('member_id', 'like', '%' . $search . '%')
                    ->orWhere('member_name', 'like', '%' . $search . '%')
                    ->orWhere('subject', 'like', '%' . $search . '%')
                    ->orWhere('category', 'like', '%' . $search . '%')
                    ->orWhere('message', 'like', '%' . $search . '%')
                    ->orWhere('status', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', trim((string) $request->input('status')));
        }

        if ($request->filled('category')) {
            $query->where('category', trim((string) $request->input('category')));
        }

        if ($request->filled('member_id')) {
            $query->where('member_id', trim((string) $request->input('member_id')));
        }

        $perPage = (int) $request->input('per_page', 10);
        $perPage = $perPage > 0 ? min($perPage, 100) : 10;

        $complaints = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Complaints fetched successfully',
            'data' => $complaints,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $complaint = Complaint::query()
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$complaint) {
            return response()->json([
                'success' => false,
                'message' => 'Complaint not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Complaint fetched successfully',
            'data' => $complaint,
        ]);
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::query()
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$complaint) {
            return response()->json([
                'success' => false,
                'message' => 'Complaint not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'message' => ['required', 'string'],
            'updated_by' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $existingReplies = $complaint->admin_reply;

        if (!is_array($existingReplies)) {
            $decoded = json_decode((string) $complaint->admin_reply, true);
            $existingReplies = is_array($decoded) ? $decoded : [];
        }

        $existingReplies[] = [
            'message' => trim((string) $request->input('message')),
            'timestamp' => now()->format('Y-m-d H:i:s'),
            'updated_by' => $request->filled('updated_by') ? trim((string) $request->input('updated_by')) : null,
        ];

        $complaint->admin_reply = $existingReplies;
        $complaint->status = $request->filled('status')
            ? trim((string) $request->input('status'))
            : 'Replied';
        $complaint->updated_by = $request->filled('updated_by')
            ? trim((string) $request->input('updated_by'))
            : $complaint->updated_by;
        $complaint->updated_at = Carbon::now()->format('Y-m-d H:i:s');
        $complaint->save();

        return response()->json([
            'success' => true,
            'message' => 'Complaint reply added successfully',
            'data' => $complaint,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::query()
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$complaint) {
            return response()->json([
                'success' => false,
                'message' => 'Complaint not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'deleted_by' => ['nullable', 'string', 'max:100'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $complaint->is_deleted = 1;
        $complaint->deleted_by = $request->filled('deleted_by')
            ? trim((string) $request->input('deleted_by'))
            : null;
        $complaint->updated_at = Carbon::now()->format('Y-m-d H:i:s');
        $complaint->save();

        return response()->json([
            'success' => true,
            'message' => 'Complaint deleted successfully',
        ]);
    }
}