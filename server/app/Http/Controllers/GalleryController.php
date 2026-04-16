<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class GalleryController extends Controller
{
    private string $publicDirectory = 'gallery_files';

    public function getData(): JsonResponse
    {
        $folders = Gallery::query()
            ->where(function ($query) {
                $query->whereNull('is_deleted')->orWhere('is_deleted', false)->orWhere('is_deleted', 0);
            })
            ->orderBy('folder_name')
            ->orderBy('id')
            ->get()
            ->map(function (Gallery $gallery) {
                $files = $this->transformFiles($gallery->photos_json);

                return [
                    'id' => $gallery->id,
                    'folder_name' => (string) $gallery->folder_name,
                    'created_by' => $gallery->created_by,
                    'created_at' => optional($gallery->created_at)?->toDateTimeString(),
                    'updated_by' => $gallery->updated_by,
                    'updated_at' => optional($gallery->updated_at)?->toDateTimeString(),
                    'total_files' => $files->count(),
                    'files' => $files->values()->all(),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Gallery data fetched successfully',
            'data' => [
                'total_folders' => $folders->count(),
                'total_files' => $folders->sum('total_files'),
                'folders' => $folders,
            ],
        ]);
    }

    public function addFolder(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'folder_name' => ['required', 'string', 'max:150'],
            'created_by' => ['nullable', 'string', 'max:100'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $folderName = trim((string) $request->input('folder_name'));

        $exists = Gallery::query()
            ->whereRaw('LOWER(folder_name) = ?', [Str::lower($folderName)])
            ->where(function ($query) {
                $query->whereNull('is_deleted')->orWhere('is_deleted', 0)->orWhere('is_deleted', false);
            })
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Folder already exists',
                'errors' => [
                    'folder_name' => ['A folder with this name already exists'],
                ],
            ], 422);
        }

        $gallery = new Gallery();
        $gallery->folder_name = $folderName;
        $gallery->photos_json = [];
        $gallery->created_by = $this->normalizeNullableString($request->input('created_by'));
        $gallery->created_at = now();
        $gallery->updated_by = $this->normalizeNullableString($request->input('created_by'));
        $gallery->updated_at = now();
        $gallery->is_deleted = 0;
        $gallery->deleted_by = null;
        $gallery->save();

        return response()->json([
            'success' => true,
            'message' => 'Folder added successfully',
            'data' => $this->formatFolder($gallery),
        ], 201);
    }

    public function addFile(Request $request, int $folderId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'updated_by' => ['nullable', 'string', 'max:100'],
            'file' => ['required_without:link', 'file', 'max:51200'],
            'link' => ['required_without:file', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $gallery = Gallery::query()
            ->where('id', $folderId)
            ->where(function ($query) {
                $query->whereNull('is_deleted')->orWhere('is_deleted', 0)->orWhere('is_deleted', false);
            })
            ->first();

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found',
                'errors' => [
                    'folder_id' => ['Valid folder not found'],
                ],
            ], 404);
        }

        $storedLink = $this->storeUploadedFile($request);

        if ($storedLink instanceof JsonResponse) {
            return $storedLink;
        }

        $files = is_array($gallery->photos_json) ? array_values($gallery->photos_json) : [];
        $files[] = [
            'title' => $this->normalizeNullableString($request->input('title')),
            'link' => $storedLink,
            'description' => $this->normalizeNullableString($request->input('description')),
            'updated_by' => $this->normalizeNullableString($request->input('updated_by')),
        ];

        $gallery->photos_json = $files;
        $gallery->updated_by = $this->normalizeNullableString($request->input('updated_by'));
        $gallery->updated_at = now();
        $gallery->save();

        return response()->json([
            'success' => true,
            'message' => 'File added successfully',
            'data' => [
                'folder' => $this->formatFolder($gallery),
                'file' => $this->formatFile(end($files), count($files) - 1),
            ],
        ], 201);
    }

    public function updateFolder(Request $request, int $folderId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'folder_name' => ['required', 'string', 'max:150'],
            'updated_by' => ['nullable', 'string', 'max:100'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $gallery = Gallery::query()
            ->where('id', $folderId)
            ->where(function ($query) {
                $query->whereNull('is_deleted')->orWhere('is_deleted', 0)->orWhere('is_deleted', false);
            })
            ->first();

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found',
                'errors' => [
                    'folder_id' => ['Valid folder not found'],
                ],
            ], 404);
        }

        $folderName = trim((string) $request->input('folder_name'));

        $exists = Gallery::query()
            ->where('id', '!=', $folderId)
            ->whereRaw('LOWER(folder_name) = ?', [Str::lower($folderName)])
            ->where(function ($query) {
                $query->whereNull('is_deleted')->orWhere('is_deleted', 0)->orWhere('is_deleted', false);
            })
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Folder name already exists',
                'errors' => [
                    'folder_name' => ['A folder with this name already exists'],
                ],
            ], 422);
        }

        $gallery->folder_name = $folderName;
        $gallery->updated_by = $this->normalizeNullableString($request->input('updated_by'));
        $gallery->updated_at = now();
        $gallery->save();

        return response()->json([
            'success' => true,
            'message' => 'Folder updated successfully',
            'data' => $this->formatFolder($gallery),
        ]);
    }

    public function updateFile(Request $request, int $folderId, int $fileIndex): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'updated_by' => ['nullable', 'string', 'max:100'],
            'file' => ['nullable', 'file', 'max:51200'],
            'link' => ['nullable', 'string', 'max:1000'],
            'replace_existing_file' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $gallery = Gallery::query()
            ->where('id', $folderId)
            ->where(function ($query) {
                $query->whereNull('is_deleted')->orWhere('is_deleted', 0)->orWhere('is_deleted', false);
            })
            ->first();

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found',
                'errors' => [
                    'folder_id' => ['Valid folder not found'],
                ],
            ], 404);
        }

        $files = is_array($gallery->photos_json) ? array_values($gallery->photos_json) : [];

        if (!array_key_exists($fileIndex, $files) || !is_array($files[$fileIndex])) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
                'errors' => [
                    'file_index' => ['Valid file index not found'],
                ],
            ], 404);
        }

        $existingFile = $files[$fileIndex];
        $replaceExistingFile = (bool) $request->boolean('replace_existing_file', false);

        if ($request->hasFile('file') || $request->filled('link')) {
            $newLink = $this->storeUploadedFile($request);

            if ($newLink instanceof JsonResponse) {
                return $newLink;
            }

            if ($replaceExistingFile && !empty($existingFile['link']) && $newLink !== (string) $existingFile['link']) {
                $this->deletePhysicalFile((string) $existingFile['link']);
            }

            $existingFile['link'] = $newLink;
        }

        if ($request->exists('title')) {
            $existingFile['title'] = $this->normalizeNullableString($request->input('title'));
        }

        if ($request->exists('description')) {
            $existingFile['description'] = $this->normalizeNullableString($request->input('description'));
        }

        $existingFile['updated_by'] = $this->normalizeNullableString($request->input('updated_by'));

        $files[$fileIndex] = $existingFile;

        $gallery->photos_json = array_values($files);
        $gallery->updated_by = $this->normalizeNullableString($request->input('updated_by'));
        $gallery->updated_at = now();
        $gallery->save();

        return response()->json([
            'success' => true,
            'message' => 'File updated successfully',
            'data' => [
                'folder' => $this->formatFolder($gallery),
                'file' => $this->formatFile($files[$fileIndex], $fileIndex),
            ],
        ]);
    }

    public function deleteFolder(Request $request, int $folderId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'deleted_by' => ['nullable', 'string', 'max:100'],
            'delete_files' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $gallery = Gallery::query()
            ->where('id', $folderId)
            ->where(function ($query) {
                $query->whereNull('is_deleted')->orWhere('is_deleted', 0)->orWhere('is_deleted', false);
            })
            ->first();

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found',
                'errors' => [
                    'folder_id' => ['Valid folder not found'],
                ],
            ], 404);
        }

        $deleteFiles = (bool) $request->boolean('delete_files', false);
        $files = is_array($gallery->photos_json) ? $gallery->photos_json : [];

        if ($deleteFiles) {
            foreach ($files as $file) {
                if (is_array($file) && !empty($file['link'])) {
                    $this->deletePhysicalFile((string) $file['link']);
                }
            }
        }

        $gallery->is_deleted = 1;
        $gallery->deleted_by = $this->normalizeNullableString($request->input('deleted_by'));
        $gallery->updated_by = $this->normalizeNullableString($request->input('deleted_by'));
        $gallery->updated_at = now();
        $gallery->save();

        return response()->json([
            'success' => true,
            'message' => 'Folder deleted successfully',
            'data' => [
                'id' => $gallery->id,
                'folder_name' => $gallery->folder_name,
                'is_deleted' => (bool) $gallery->is_deleted,
                'deleted_by' => $gallery->deleted_by,
            ],
        ]);
    }

    public function deleteFile(Request $request, int $folderId, int $fileIndex): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'deleted_by' => ['nullable', 'string', 'max:100'],
            'delete_physical_file' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $gallery = Gallery::query()
            ->where('id', $folderId)
            ->where(function ($query) {
                $query->whereNull('is_deleted')->orWhere('is_deleted', 0)->orWhere('is_deleted', false);
            })
            ->first();

        if (!$gallery) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found',
                'errors' => [
                    'folder_id' => ['Valid folder not found'],
                ],
            ], 404);
        }

        $files = is_array($gallery->photos_json) ? array_values($gallery->photos_json) : [];

        if (!array_key_exists($fileIndex, $files) || !is_array($files[$fileIndex])) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
                'errors' => [
                    'file_index' => ['Valid file index not found'],
                ],
            ], 404);
        }

        $deletedFile = $files[$fileIndex];
        $deletePhysicalFile = (bool) $request->boolean('delete_physical_file', true);

        if ($deletePhysicalFile && !empty($deletedFile['link'])) {
            $this->deletePhysicalFile((string) $deletedFile['link']);
        }

        unset($files[$fileIndex]);
        $files = array_values($files);

        $gallery->photos_json = $files;
        $gallery->updated_by = $this->normalizeNullableString($request->input('deleted_by'));
        $gallery->updated_at = now();
        $gallery->save();

        return response()->json([
            'success' => true,
            'message' => 'File deleted successfully',
            'data' => [
                'deleted_file' => $this->formatFile($deletedFile, $fileIndex),
                'folder' => $this->formatFolder($gallery),
            ],
        ]);
    }

    private function transformFiles(mixed $photosJson): Collection
    {
        $files = collect(is_array($photosJson) ? $photosJson : []);

        return $files
            ->filter(fn($item) => is_array($item) && !empty($item['link']))
            ->map(function (array $item, int $index) {
                $rawLink = trim((string) ($item['link'] ?? ''));
                $fileName = $this->extractFileName($rawLink);
                $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

                return [
                    'id' => $index + 1,
                    'file_index' => $index,
                    'title' => $this->normalizeNullableString($item['title'] ?? null),
                    'description' => $this->normalizeNullableString($item['description'] ?? null),
                    'updated_by' => $this->normalizeNullableString($item['updated_by'] ?? null),
                    'original_link' => $rawLink,
                    'file_name' => $fileName,
                    'extension' => $extension !== '' ? $extension : null,
                    'file_type' => $this->detectFileType($extension),
                    'file_url' => $this->resolveFileUrl($fileName),
                    'previewable' => $this->isPreviewable($extension),
                ];
            });
    }

    private function storeUploadedFile(Request $request): string|JsonResponse
    {
        if ($request->hasFile('file')) {
            $file = $request->file('file');

            if (!$file instanceof UploadedFile || !$file->isValid()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Uploaded file is invalid',
                ], 422);
            }

            $uploadDirectory = '/home/u337215155/domains/bsnpm.in/public_html/gallery_files';

            if (!is_dir($uploadDirectory)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Upload directory not found',
                    'errors' => [
                        'upload_path' => [$uploadDirectory],
                    ],
                ], 500);
            }

            if (!is_writable($uploadDirectory)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Upload directory is not writable',
                    'errors' => [
                        'upload_path' => [$uploadDirectory],
                    ],
                ], 500);
            }

            $originalName = $file->getClientOriginalName();
            $safeOriginalName = preg_replace('/[^A-Za-z0-9\-\_\.]/', '_', (string) $originalName);
            $fileName = time() . '_' . $safeOriginalName;

            $file->move($uploadDirectory, $fileName);

            return $fileName;
        }

        $link = trim((string) $request->input('link'));

        if ($link === '') {
            return '';
        }

        if (filter_var($link, FILTER_VALIDATE_URL)) {
            $path = parse_url($link, PHP_URL_PATH);
            $fileName = is_string($path) ? basename($path) : basename($link);
            return $fileName !== '' ? $fileName : $link;
        }

        return basename(str_replace('\\', '/', $link));
    }

    private function deletePhysicalFile(string $path): void
    {
        $fileName = $this->extractFileName($path);

        if ($fileName === '') {
            return;
        }

        $fullPath = '/home/u337215155/domains/bsnpm.in/public_html/gallery_files' . DIRECTORY_SEPARATOR . $fileName;

        if (is_file($fullPath)) {
            @unlink($fullPath);
        }
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        $string = trim((string) $value);

        return $string !== '' ? $string : null;
    }

    private function formatFolder(Gallery $gallery): array
    {
        $files = is_array($gallery->photos_json) ? array_values($gallery->photos_json) : [];

        return [
            'id' => $gallery->id,
            'folder_name' => (string) $gallery->folder_name,
            'created_by' => $gallery->created_by,
            'created_at' => optional($gallery->created_at)?->toDateTimeString(),
            'updated_by' => $gallery->updated_by,
            'updated_at' => optional($gallery->updated_at)?->toDateTimeString(),
            'is_deleted' => (bool) $gallery->is_deleted,
            'deleted_by' => $gallery->deleted_by,
            'total_files' => count($files),
            'files' => collect($files)->values()->map(function ($file, $index) {
                return $this->formatFile(is_array($file) ? $file : [], (int) $index);
            })->all(),
        ];
    }

    private function formatFile(array $file, int $index): array
    {
        $link = trim((string) ($file['link'] ?? ''));
        $fileName = $this->extractFileName($link);
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        return [
            'file_index' => $index,
            'title' => $this->normalizeNullableString($file['title'] ?? null),
            'description' => $this->normalizeNullableString($file['description'] ?? null),
            'updated_by' => $this->normalizeNullableString($file['updated_by'] ?? null),
            'link' => $fileName !== '' ? $fileName : null,
            'file_name' => $fileName !== '' ? $fileName : null,
            'extension' => $extension !== '' ? $extension : null,
            'file_type' => $this->detectFileType($extension),
            'file_url' => $this->resolveFileUrl($fileName),
            'previewable' => $this->isPreviewable($extension),
        ];
    }

    private function extractFileName(string $path): string
    {
        if ($path === '') {
            return '';
        }

        $cleanPath = parse_url($path, PHP_URL_PATH);

        if (is_string($cleanPath) && $cleanPath !== '') {
            return basename($cleanPath);
        }

        return basename($path);
    }

    private function detectFileType(string $extension): string
    {
        return match ($extension) {
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif' => 'image',
            'mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm', 'm4v' => 'video',
            'mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a' => 'audio',
            'pdf' => 'pdf',
            'doc', 'docx' => 'document',
            'xls', 'xlsx', 'csv' => 'spreadsheet',
            'ppt', 'pptx' => 'presentation',
            'zip', 'rar', '7z', 'tar', 'gz' => 'archive',
            'txt', 'json', 'xml', 'html', 'css', 'js', 'ts', 'php' => 'text',
            default => 'file',
        };
    }

    private function isPreviewable(string $extension): bool
    {
        return in_array($extension, [
            'jpg',
            'jpeg',
            'png',
            'gif',
            'webp',
            'bmp',
            'svg',
            'avif',
            'pdf',
            'mp4',
            'mov',
            'avi',
            'wmv',
            'mkv',
            'webm',
            'm4v',
            'mp3',
            'wav',
            'aac',
            'ogg',
            'flac',
            'm4a',
            'txt',
            'json',
        ], true);
    }

    private function resolveFileUrl(string $path): ?string
    {
        $fileName = $this->extractFileName($path);

        if ($fileName === '') {
            return null;
        }

        return 'https://bsnpm.in/gallery_files/' . ltrim($fileName, '/');
    }
}