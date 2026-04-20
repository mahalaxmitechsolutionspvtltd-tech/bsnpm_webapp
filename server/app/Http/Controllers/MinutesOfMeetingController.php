<?php

namespace App\Http\Controllers;

use App\Models\MinutesOfMeeting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MinutesOfMeetingController extends Controller
{
    public function getAllMom(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 10);

        if ($perPage < 1) {
            $perPage = 10;
        }

        if ($perPage > 100) {
            $perPage = 100;
        }

        $query = MinutesOfMeeting::query()
            ->where('is_deleted', 0);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('audience', 'like', '%' . $search . '%')
                    ->orWhere('key_points', 'like', '%' . $search . '%');
            });
        }

        $moms = $query
            ->orderByDesc('meeting_date')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Minutes of meetings fetched successfully.',
            'data' => $moms,
        ], 200);
    }

    public function addMom(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'audience' => ['nullable', 'string', 'max:255'],
            'meeting_date' => ['required', 'date'],
            'publish_date' => ['nullable', 'date'],
            'key_points' => ['nullable', 'string'],
            'attachment_file' => ['nullable', 'string', 'max:255'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $mom = MinutesOfMeeting::create([
            'title' => $data['title'],
            'audience' => $data['audience'] ?? null,
            'meeting_date' => $data['meeting_date'],
            'publish_date' => $data['publish_date'] ?? null,
            'key_points' => $data['key_points'] ?? null,
            'attachment_file' => $data['attachment_file'] ?? null,
            'is_published' => (bool) ($data['is_published'] ?? false),
            'is_deleted' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Minutes of meeting created successfully.',
            'data' => $mom,
        ], 201);
    }

    public function updateMom(Request $request, int $id): JsonResponse
    {
        $mom = MinutesOfMeeting::where('is_deleted', 0)->find($id);

        if (!$mom) {
            return response()->json([
                'success' => false,
                'message' => 'Minutes of meeting not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'audience' => ['nullable', 'string', 'max:255'],
            'meeting_date' => ['sometimes', 'required', 'date'],
            'publish_date' => ['nullable', 'date'],
            'key_points' => ['nullable', 'string'],
            'attachment_file' => ['nullable', 'string', 'max:255'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $mom->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Minutes of meeting updated successfully.',
            'data' => $mom->fresh(),
        ], 200);
    }

    public function deleteMom(int $id): JsonResponse
    {
        $mom = MinutesOfMeeting::where('is_deleted', 0)->find($id);

        if (!$mom) {
            return response()->json([
                'success' => false,
                'message' => 'Minutes of meeting not found.',
            ], 404);
        }

        $mom->update([
            'is_deleted' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Minutes of meeting deleted successfully.',
        ], 200);
    }

    public function publishMom(Request $request, int $id): JsonResponse
    {
        $mom = MinutesOfMeeting::where('is_deleted', 0)->find($id);

        if (!$mom) {
            return response()->json([
                'success' => false,
                'message' => 'Minutes of meeting not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'is_published' => ['nullable', 'boolean'],
            'publish_date' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $isPublished = array_key_exists('is_published', $data) ? (bool) $data['is_published'] : true;

        $mom->update([
            'is_published' => $isPublished,
            'publish_date' => $isPublished
                ? ($data['publish_date'] ?? now()->toDateString())
                : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => $isPublished
                ? 'Minutes of meeting published successfully.'
                : 'Minutes of meeting unpublished successfully.',
            'data' => $mom->fresh(),
        ], 200);
    }
}