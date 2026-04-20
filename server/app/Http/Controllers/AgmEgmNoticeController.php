<?php

namespace App\Http\Controllers;

use App\Models\AgmEgmNotice;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AgmEgmNoticeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AgmEgmNotice::query()
            ->where('is_deleted', 0);

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }

        if ($request->filled('audience')) {
            $query->where('audience', $request->string('audience')->toString());
        }

        if ($request->filled('is_published')) {
            $query->where('is_published', (int) $request->input('is_published'));
        }

        if ($request->filled('is_drafted')) {
            $query->where('is_drafted', (int) $request->input('is_drafted'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('type', 'like', '%' . $search . '%')
                    ->orWhere('audience', 'like', '%' . $search . '%')
                    ->orWhere('created_by', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('meeting_at', '>=', $request->input('from_date'));
        }

        if ($request->filled('to_date')) {
            $query->whereDate('meeting_at', '<=', $request->input('to_date'));
        }

        $perPage = (int) $request->input('per_page', 10);
        $perPage = $perPage > 0 ? min($perPage, 100) : 10;

        $notices = $query
            ->orderByDesc('meeting_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        $notices->getCollection()->transform(function (AgmEgmNotice $notice) {
            $notice->attachment_url = $this->buildAttachmentUrl($notice->attachment_file);
            return $notice;
        });

        return response()->json([
            'success' => true,
            'message' => 'Notifications fetched successfully',
            'data' => $notices,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $notice = AgmEgmNotice::query()
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$notice) {
            return response()->json([
                'success' => false,
                'message' => 'Notice not found',
            ], 404);
        }

        $notice->attachment_url = $this->buildAttachmentUrl($notice->attachment_file);

        return response()->json([
            'success' => true,
            'message' => 'Notice fetched successfully',
            'data' => $notice,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => ['required', 'string', 'max:20'],
            'audience' => ['nullable', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:200'],
            'meeting_at' => ['nullable', 'date'],
            'is_published' => ['nullable', 'boolean'],
            'is_drafted' => ['nullable', 'boolean'],
            'publish_date' => ['nullable', 'date'],
            'attachment_file' => ['nullable', 'file', 'max:10240', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx,webp'],
            'created_by' => ['nullable', 'string', 'max:100'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $attachmentFileName = null;

        if ($request->hasFile('attachment_file')) {
            $attachmentFileName = $this->storeAttachment($request->file('attachment_file'));
        }

        $notice = AgmEgmNotice::create([
            'type' => trim((string) $request->input('type')),
            'audience' => $request->filled('audience') ? trim((string) $request->input('audience')) : null,
            'title' => trim((string) $request->input('title')),
            'meeting_at' => $request->filled('meeting_at') ? Carbon::parse($request->input('meeting_at'))->format('Y-m-d H:i:s') : null,
            'is_published' => (int) $request->boolean('is_published', false),
            'is_drafted' => (int) $request->boolean('is_drafted', true),
            'publish_date' => $request->filled('publish_date') ? Carbon::parse($request->input('publish_date'))->format('Y-m-d H:i:s') : null,
            'attachment_file' => $attachmentFileName,
            'created_by' => $request->filled('created_by') ? trim((string) $request->input('created_by')) : null,
            'created_at' => now(),
            'updated_by' => null,
            'update_at' => null,
            'is_deleted' => 0,
            'deleted_by' => null,
        ]);

        $notice->attachment_url = $this->buildAttachmentUrl($notice->attachment_file);

        return response()->json([
            'success' => true,
            'message' => 'Notice created successfully',
            'data' => $notice,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $notice = AgmEgmNotice::query()
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$notice) {
            return response()->json([
                'success' => false,
                'message' => 'Notice not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'type' => ['sometimes', 'required', 'string', 'max:20'],
            'audience' => ['nullable', 'string', 'max:100'],
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'meeting_at' => ['nullable', 'date'],
            'is_published' => ['nullable', 'boolean'],
            'is_drafted' => ['nullable', 'boolean'],
            'publish_date' => ['nullable', 'date'],
            'attachment_file' => ['nullable', 'file', 'max:10240', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx,webp'],
            'updated_by' => ['nullable', 'string', 'max:100'],
            'remove_attachment' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $attachmentFileName = $notice->attachment_file;

        if ($request->boolean('remove_attachment')) {
            $this->deleteAttachment($notice->attachment_file);
            $attachmentFileName = null;
        }

        if ($request->hasFile('attachment_file')) {
            $this->deleteAttachment($notice->attachment_file);
            $attachmentFileName = $this->storeAttachment($request->file('attachment_file'));
        }

        if ($request->has('type')) {
            $notice->type = trim((string) $request->input('type'));
        }

        if ($request->has('audience')) {
            $notice->audience = $request->filled('audience') ? trim((string) $request->input('audience')) : null;
        }

        if ($request->has('title')) {
            $notice->title = trim((string) $request->input('title'));
        }

        if ($request->has('meeting_at')) {
            $notice->meeting_at = $request->filled('meeting_at')
                ? Carbon::parse($request->input('meeting_at'))->format('Y-m-d H:i:s')
                : null;
        }

        if ($request->has('is_published')) {
            $notice->is_published = (int) $request->boolean('is_published');
        }

        if ($request->has('is_drafted')) {
            $notice->is_drafted = (int) $request->boolean('is_drafted');
        }

        if ($request->has('publish_date')) {
            $notice->publish_date = $request->filled('publish_date')
                ? Carbon::parse($request->input('publish_date'))->format('Y-m-d H:i:s')
                : null;
        }

        $notice->attachment_file = $attachmentFileName;
        $notice->updated_by = $request->filled('updated_by') ? trim((string) $request->input('updated_by')) : $notice->updated_by;
        $notice->update_at = now();
        $notice->save();

        $notice->attachment_url = $this->buildAttachmentUrl($notice->attachment_file);

        return response()->json([
            'success' => true,
            'message' => 'Notice updated successfully',
            'data' => $notice,
        ]);
    }

    public function publish(Request $request, int $id): JsonResponse
    {
        $notice = AgmEgmNotice::query()
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$notice) {
            return response()->json([
                'success' => false,
                'message' => 'Notice not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'updated_by' => ['nullable', 'string', 'max:100'],
            'publish_date' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $notice->is_published = 1;
        $notice->is_drafted = 0;
        $notice->publish_date = $request->filled('publish_date')
            ? Carbon::parse($request->input('publish_date'))->format('Y-m-d H:i:s')
            : now()->format('Y-m-d H:i:s');
        $notice->updated_by = $request->filled('updated_by') ? trim((string) $request->input('updated_by')) : $notice->updated_by;
        $notice->update_at = now();
        $notice->save();

        $notice->attachment_url = $this->buildAttachmentUrl($notice->attachment_file);

        return response()->json([
            'success' => true,
            'message' => 'Notice published successfully',
            'data' => $notice,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $notice = AgmEgmNotice::query()
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        if (!$notice) {
            return response()->json([
                'success' => false,
                'message' => 'Notice not found',
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

        $notice->is_deleted = 1;
        $notice->deleted_by = $request->filled('deleted_by') ? trim((string) $request->input('deleted_by')) : null;
        $notice->update_at = now();
        $notice->save();

        return response()->json([
            'success' => true,
            'message' => 'Notice deleted successfully',
        ]);
    }

    protected function storeAttachment($file): string
    {
        $directory = public_path('agm_egm_notice');

        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        $originalName = $file->getClientOriginalName();
        $sanitizedName = preg_replace('/[^A-Za-z0-9\-\._]/u', '_', $originalName);
        $fileName = time() . '_' . $sanitizedName;
        $file->move($directory, $fileName);

        return $fileName;
    }

    protected function deleteAttachment(?string $fileName): void
    {
        if (!$fileName) {
            return;
        }

        $path = public_path('agm_egm_notice/' . $fileName);

        if (file_exists($path)) {
            unlink($path);
        }
    }

    protected function buildAttachmentUrl(?string $fileName): ?string
    {
        if (!$fileName) {
            return null;
        }

        $appUrl = rtrim((string) config('app.url'), '/');

        return $appUrl . '/agm_egm_notice/' . $fileName;
    }
}