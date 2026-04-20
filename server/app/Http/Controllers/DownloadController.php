<?php

namespace App\Http\Controllers;

use App\Models\Download;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class DownloadController extends Controller
{
    public function getAllDownloads(Request $request): JsonResponse
    {
        $query = Download::query()->where('is_deleted', 0);

        if ($request->filled('search')) {
            $search = trim((string) $request->string('search'));
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%')
                    ->orWhere('created_by', 'like', '%' . $search . '%');
            });
        }

        $downloads = $query
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Downloads fetched successfully.',
            'data' => $downloads,
        ]);
    }

    public function addDownload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'attachment' => ['required', 'file', 'max:20480'],
            'created_by' => ['nullable', 'string', 'max:255'],
            'updated_by' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $attachmentPath = null;
        $uploadDirectory = public_path('uploads/downloads');

        if (!File::exists($uploadDirectory)) {
            File::makeDirectory($uploadDirectory, 0755, true);
        }

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = $file->getClientOriginalExtension();
            $safeName = Str::slug($originalName ?: 'file');
            $fileName = time() . '_' . Str::random(8) . '_' . $safeName . ($extension ? '.' . $extension : '');

            $file->move($uploadDirectory, $fileName);

            $attachmentPath = 'uploads/downloads/' . $fileName;
        }

        $download = Download::create([
            'title' => $request->string('title')->toString(),
            'description' => $request->input('description'),
            'attachment' => $attachmentPath,
            'created_by' => $request->input('created_by'),
            'updated_by' => $request->input('updated_by'),
            'is_deleted' => 0,
            'deleted_by' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Download added successfully.',
            'data' => $download,
        ], 201);
    }

    public function updateDownload(Request $request, int $id): JsonResponse
    {
        $download = Download::where('is_deleted', 0)->find($id);

        if (!$download) {
            return response()->json([
                'success' => false,
                'message' => 'Download not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'attachment' => ['nullable', 'file', 'max:20480'],
            'updated_by' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $attachmentPath = $download->attachment;
        $uploadDirectory = public_path('uploads/downloads');

        if (!File::exists($uploadDirectory)) {
            File::makeDirectory($uploadDirectory, 0755, true);
        }

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = $file->getClientOriginalExtension();
            $safeName = Str::slug($originalName ?: 'file');
            $fileName = time() . '_' . Str::random(8) . '_' . $safeName . ($extension ? '.' . $extension : '');

            $file->move($uploadDirectory, $fileName);

            $attachmentPath = 'uploads/downloads/' . $fileName;
        }

        $download->fill([
            'title' => $request->has('title') ? $request->string('title')->toString() : $download->title,
            'description' => $request->has('description') ? $request->input('description') : $download->description,
            'attachment' => $attachmentPath,
            'updated_by' => $request->has('updated_by') ? $request->input('updated_by') : $download->updated_by,
        ]);

        $download->save();

        return response()->json([
            'success' => true,
            'message' => 'Download updated successfully.',
            'data' => $download,
        ]);
    }

    public function deleteDownload(Request $request, int $id): JsonResponse
    {
        $download = Download::where('is_deleted', 0)->find($id);

        if (!$download) {
            return response()->json([
                'success' => false,
                'message' => 'Download not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'deleted_by' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $download->update([
            'is_deleted' => 1,
            'deleted_by' => $request->input('deleted_by'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Download deleted successfully.',
        ]);
    }
}