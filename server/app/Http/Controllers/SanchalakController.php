<?php

namespace App\Http\Controllers;

use App\Models\Sanchalak;
use Cloudinary\Cloudinary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SanchalakController extends Controller
{
    private const MAX_PROFILE_PHOTO_SIZE_KB = 15360;

    private function jsonResponse(array $data, int $status = 200): JsonResponse
    {
        return response()->json($data, $status, [], JSON_UNESCAPED_SLASHES);
    }

    private function cloudinary(): Cloudinary
    {
        return new Cloudinary([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'api_key' => config('services.cloudinary.api_key'),
                'api_secret' => config('services.cloudinary.api_secret'),
            ],
            'url' => [
                'secure' => true,
            ],
        ]);
    }

    private function uploadProfilePhoto(Request $request): ?string
    {
        if (!$request->hasFile('profile_photo')) {
            return null;
        }

        $file = $request->file('profile_photo');

        if (!$file->isValid()) {
            throw ValidationException::withMessages([
                'profile_photo' => ['Profile photo upload failed. Please upload an image below 15MB.'],
            ]);
        }

        $uploadedFile = $this->cloudinary()->uploadApi()->upload(
            $file->getRealPath(),
            [
                'folder' => 'bsnpm_sanchalak',
                'resource_type' => 'image',
            ]
        );

        return $uploadedFile['secure_url'] ?? null;
    }

    public function createSanchalak(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'sanchalak_name' => ['required', 'string', 'max:255'],
                'sanchalak_email' => ['required', 'email', 'max:255', 'unique:sanchalakas,sanchalak_email'],
                'sanchalak_mobile' => ['required', 'string', 'max:20', 'unique:sanchalakas,sanchalak_mobile'],
                'password' => ['required', 'string', 'min:6', 'max:255'],
                'status' => ['required', 'string', Rule::in(['active', 'inactive', 'blocked'])],
                'profile_photo' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:' . self::MAX_PROFILE_PHOTO_SIZE_KB],
            ]);

            $profilePhotoUrl = $this->uploadProfilePhoto($request);

            $sanchalak = Sanchalak::create([
                'sanchalak_name' => $validated['sanchalak_name'],
                'sanchalak_email' => $validated['sanchalak_email'],
                'sanchalak_mobile' => $validated['sanchalak_mobile'],
                'password' => Hash::make($validated['password']),
                'status' => $validated['status'],
                'profile_photo' => $profilePhotoUrl,
            ]);

            return $this->jsonResponse([
                'success' => true,
                'message' => 'Sanchalak created successfully',
                'data' => $sanchalak,
            ], 201);
        } catch (ValidationException $exception) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $exception->errors(),
            ], 422);
        } catch (\Throwable $exception) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Failed to create sanchalak',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    public function updateSanchalak(Request $request, int $id): JsonResponse
    {
        try {
            $sanchalak = Sanchalak::find($id);

            if (!$sanchalak) {
                return $this->jsonResponse([
                    'success' => false,
                    'message' => 'Sanchalak not found',
                ], 404);
            }

            $validated = $request->validate([
                'sanchalak_name' => ['sometimes', 'required', 'string', 'max:255'],
                'sanchalak_email' => [
                    'sometimes',
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('sanchalakas', 'sanchalak_email')->ignore($sanchalak->id),
                ],
                'sanchalak_mobile' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('sanchalakas', 'sanchalak_mobile')->ignore($sanchalak->id),
                ],
                'password' => ['nullable', 'string', 'min:6', 'max:255'],
                'status' => ['sometimes', 'required', 'string', Rule::in(['active', 'inactive', 'blocked'])],
                'profile_photo' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:' . self::MAX_PROFILE_PHOTO_SIZE_KB],
            ]);

            if (array_key_exists('sanchalak_name', $validated)) {
                $sanchalak->sanchalak_name = $validated['sanchalak_name'];
            }

            if (array_key_exists('sanchalak_email', $validated)) {
                $sanchalak->sanchalak_email = $validated['sanchalak_email'];
            }

            if (array_key_exists('sanchalak_mobile', $validated)) {
                $sanchalak->sanchalak_mobile = $validated['sanchalak_mobile'];
            }

            if (!empty($validated['password'])) {
                $sanchalak->password = Hash::make($validated['password']);
            }

            if (array_key_exists('status', $validated)) {
                $sanchalak->status = $validated['status'];
            }

            if ($request->hasFile('profile_photo')) {
                $profilePhotoUrl = $this->uploadProfilePhoto($request);

                if ($profilePhotoUrl) {
                    $sanchalak->profile_photo = $profilePhotoUrl;
                }
            }

            $sanchalak->save();

            return $this->jsonResponse([
                'success' => true,
                'message' => 'Sanchalak updated successfully',
                'data' => $sanchalak,
            ]);
        } catch (ValidationException $exception) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $exception->errors(),
            ], 422);
        } catch (\Throwable $exception) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Failed to update sanchalak',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    public function getSanchalaks(Request $request): JsonResponse
    {
        try {
            $query = Sanchalak::query();

            if ($request->filled('search')) {
                $search = trim((string) $request->query('search'));

                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->where('sanchalak_id', 'LIKE', "%{$search}%")
                        ->orWhere('sanchalak_name', 'LIKE', "%{$search}%")
                        ->orWhere('sanchalak_email', 'LIKE', "%{$search}%")
                        ->orWhere('sanchalak_mobile', 'LIKE', "%{$search}%");
                });
            }

            if ($request->filled('status') && $request->query('status') !== 'all') {
                $query->where('status', $request->query('status'));
            }

            if ($request->filled('sanchalak_id')) {
                $query->where('sanchalak_id', $request->query('sanchalak_id'));
            }

            if ($request->filled('sanchalak_email')) {
                $query->where('sanchalak_email', $request->query('sanchalak_email'));
            }

            if ($request->filled('sanchalak_mobile')) {
                $query->where('sanchalak_mobile', $request->query('sanchalak_mobile'));
            }

            if (Schema::hasColumn('sanchalakas', 'created_at')) {
                if ($request->filled('from_date') && $request->filled('to_date')) {
                    $query->whereBetween('created_at', [
                        $request->query('from_date') . ' 00:00:00',
                        $request->query('to_date') . ' 23:59:59',
                    ]);
                } elseif ($request->filled('from_date')) {
                    $query->whereDate('created_at', '>=', $request->query('from_date'));
                } elseif ($request->filled('to_date')) {
                    $query->whereDate('created_at', '<=', $request->query('to_date'));
                }
            }

            $sortBy = (string) $request->query('sort_by', 'id');
            $sortOrder = strtolower((string) $request->query('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

            $allowedSortColumns = [
                'id',
                'sanchalak_id',
                'sanchalak_name',
                'sanchalak_email',
                'sanchalak_mobile',
                'status',
            ];

            if (Schema::hasColumn('sanchalakas', 'created_at')) {
                $allowedSortColumns[] = 'created_at';
            }

            if (Schema::hasColumn('sanchalakas', 'updated_at')) {
                $allowedSortColumns[] = 'updated_at';
            }

            if (!in_array($sortBy, $allowedSortColumns, true)) {
                $sortBy = 'id';
            }

            $query->orderBy($sortBy, $sortOrder);

            if ($request->boolean('all')) {
                $sanchalaks = $query->get();

                return $this->jsonResponse([
                    'success' => true,
                    'message' => 'Sanchalaks fetched successfully',
                    'data' => $sanchalaks,
                ]);
            }

            $perPage = (int) $request->query('per_page', 10);
            $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

            $sanchalaks = $query->paginate($perPage);

            return $this->jsonResponse([
                'success' => true,
                'message' => 'Sanchalaks fetched successfully',
                'data' => $sanchalaks->items(),
                'pagination' => [
                    'current_page' => $sanchalaks->currentPage(),
                    'last_page' => $sanchalaks->lastPage(),
                    'per_page' => $sanchalaks->perPage(),
                    'total' => $sanchalaks->total(),
                    'from' => $sanchalaks->firstItem(),
                    'to' => $sanchalaks->lastItem(),
                ],
            ]);
        } catch (\Throwable $exception) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Failed to fetch sanchalaks',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    public function getSanchalakById(int $id): JsonResponse
    {
        try {
            $sanchalak = Sanchalak::find($id);

            if (!$sanchalak) {
                return $this->jsonResponse([
                    'success' => false,
                    'message' => 'Sanchalak not found',
                ], 404);
            }

            return $this->jsonResponse([
                'success' => true,
                'message' => 'Sanchalak fetched successfully',
                'data' => $sanchalak,
            ]);
        } catch (\Throwable $exception) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Failed to fetch sanchalak',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    public function deleteSanchalak(int $id): JsonResponse
    {
        try {
            $sanchalak = Sanchalak::find($id);

            if (!$sanchalak) {
                return $this->jsonResponse([
                    'success' => false,
                    'message' => 'Sanchalak not found',
                ], 404);
            }

            $sanchalak->delete();

            return $this->jsonResponse([
                'success' => true,
                'message' => 'Sanchalak deleted successfully',
            ]);
        } catch (\Throwable $exception) {
            return $this->jsonResponse([
                'success' => false,
                'message' => 'Failed to delete sanchalak',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }
}