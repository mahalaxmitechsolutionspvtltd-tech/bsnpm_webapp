<?php

namespace App\Http\Controllers;

use App\Models\Notice;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class NoticeController extends Controller
{
    public function getNotices(Request $request): JsonResponse
    {
        $audience = strtoupper(trim((string) $request->query('audience', '')));
        $search = trim((string) $request->query('search', ''));
        $today = Carbon::now();

        $query = Notice::query()
            ->where('publish_at', '<=', $today)
            ->where(function ($q) use ($today) {
                $q->whereNull('expire_at')
                    ->orWhere('expire_at', '>=', $today);
            });

        if ($audience !== '') {
            $query->where('audience', $audience);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('message', 'like', '%' . $search . '%');
            });
        }

        $notices = $query
            ->orderBy('publish_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Notices fetched successfully',
            'data' => $notices,
        ], 200);
    }

    public function createNotice(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'audience' => ['required', 'string', 'max:100'],
            'message' => ['required', 'string'],
            'publish_at' => ['required', 'date'],
            'expire_at' => ['nullable', 'date', 'after_or_equal:publish_at'],
            'created_by_admin_id' => ['required', 'integer'],
            'updated_by_admin_id' => ['nullable', 'integer'],
            'attachment' => ['nullable', 'file', 'max:20480'],
            'attachment_path' => ['nullable', 'string', 'max:500'],
            'attachment_name' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $attachmentPath = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentPath = $file->store('notice_attachments', 'public');
            $attachmentName = $file->getClientOriginalName();
        } else {
            $attachmentPath = $request->input('attachment_path');
            $attachmentName = $request->input('attachment_name');
        }

        $notice = new Notice();
        $notice->title = trim((string) $request->input('title'));
        $notice->audience = strtoupper(trim((string) $request->input('audience')));
        $notice->message = trim((string) $request->input('message'));
        $notice->attachment_path = $attachmentPath;
        $notice->attachment_name = $attachmentName;
        $notice->publish_at = Carbon::parse($request->input('publish_at'));
        $notice->expire_at = $request->filled('expire_at') ? Carbon::parse($request->input('expire_at')) : null;
        $notice->created_by_admin_id = (int) $request->input('created_by_admin_id');
        $notice->updated_by_admin_id = $request->filled('updated_by_admin_id')
            ? (int) $request->input('updated_by_admin_id')
            : (int) $request->input('created_by_admin_id');
        $notice->save();

        return response()->json([
            'success' => true,
            'message' => 'Notice created successfully',
            'data' => $notice,
        ], 201);
    }

    public function updateNotice(Request $request, int $id): JsonResponse
    {
        $notice = Notice::find($id);

        if (!$notice) {
            return response()->json([
                'success' => false,
                'message' => 'Notice not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'audience' => ['sometimes', 'required', 'string', 'max:100'],
            'message' => ['sometimes', 'required', 'string'],
            'publish_at' => ['sometimes', 'required', 'date'],
            'expire_at' => ['nullable', 'date'],
            'updated_by_admin_id' => ['required', 'integer'],
            'attachment' => ['nullable', 'file', 'max:20480'],
            'attachment_path' => ['nullable', 'string', 'max:500'],
            'attachment_name' => ['nullable', 'string', 'max:255'],
            'remove_attachment' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $publishAt = $request->has('publish_at')
            ? Carbon::parse($request->input('publish_at'))
            : ($notice->publish_at ? Carbon::parse($notice->publish_at) : null);

        $expireAt = $request->has('expire_at') && $request->filled('expire_at')
            ? Carbon::parse($request->input('expire_at'))
            : ($request->has('expire_at') ? null : ($notice->expire_at ? Carbon::parse($notice->expire_at) : null));

        if ($publishAt && $expireAt && $expireAt->lt($publishAt)) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => [
                    'expire_at' => ['The expire at must be a date after or equal to publish at.'],
                ],
            ], 422);
        }

        if ($request->has('title')) {
            $notice->title = trim((string) $request->input('title'));
        }

        if ($request->has('audience')) {
            $notice->audience = strtoupper(trim((string) $request->input('audience')));
        }

        if ($request->has('message')) {
            $notice->message = trim((string) $request->input('message'));
        }

        if ($request->has('publish_at')) {
            $notice->publish_at = $publishAt;
        }

        if ($request->has('expire_at')) {
            $notice->expire_at = $expireAt;
        }

        $removeAttachment = filter_var($request->input('remove_attachment', false), FILTER_VALIDATE_BOOLEAN);

        if ($request->hasFile('attachment')) {
            if (!empty($notice->attachment_path) && Storage::disk('public')->exists($notice->attachment_path)) {
                Storage::disk('public')->delete($notice->attachment_path);
            }

            $file = $request->file('attachment');
            $notice->attachment_path = $file->store('notice_attachments', 'public');
            $notice->attachment_name = $file->getClientOriginalName();
        } elseif ($removeAttachment) {
            if (!empty($notice->attachment_path) && Storage::disk('public')->exists($notice->attachment_path)) {
                Storage::disk('public')->delete($notice->attachment_path);
            }

            $notice->attachment_path = null;
            $notice->attachment_name = null;
        } else {
            if ($request->has('attachment_path')) {
                $notice->attachment_path = $request->input('attachment_path');
            }

            if ($request->has('attachment_name')) {
                $notice->attachment_name = $request->input('attachment_name');
            }
        }

        $notice->updated_by_admin_id = (int) $request->input('updated_by_admin_id');
        $notice->save();

        return response()->json([
            'success' => true,
            'message' => 'Notice updated successfully',
            'data' => $notice,
        ], 200);
    }

    public function deleteNotice(int $id): JsonResponse
    {
        $notice = Notice::find($id);

        if (!$notice) {
            return response()->json([
                'success' => false,
                'message' => 'Notice not found',
            ], 404);
        }

        if (!empty($notice->attachment_path) && Storage::disk('public')->exists($notice->attachment_path)) {
            Storage::disk('public')->delete($notice->attachment_path);
        }

        $notice->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notice deleted successfully',
        ], 200);
    }
}