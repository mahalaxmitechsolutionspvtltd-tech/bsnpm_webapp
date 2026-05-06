<?php

namespace App\Http\Controllers;

use Cloudinary\Cloudinary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CloudinaryUploadController extends Controller
{
    public function uploadImage(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            ]);

            $cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => config('services.cloudinary.cloud_name'),
                    'api_key' => config('services.cloudinary.api_key'),
                    'api_secret' => config('services.cloudinary.api_secret'),
                ],
                'url' => [
                    'secure' => true,
                ],
            ]);

            $uploadedFile = $cloudinary->uploadApi()->upload(
                $validated['image']->getRealPath(),
                [
                    'folder' => 'bsnpm/sanchalaks',
                    'resource_type' => 'image',
                    'overwrite' => true,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'data' => [
                    'public_id' => $uploadedFile['public_id'],
                    'secure_url' => $uploadedFile['secure_url'],
                    'url' => $uploadedFile['url'],
                    'format' => $uploadedFile['format'],
                    'width' => $uploadedFile['width'],
                    'height' => $uploadedFile['height'],
                    'bytes' => $uploadedFile['bytes'],
                ],
            ], 201);
        } catch (ValidationException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $exception->errors(),
            ], 422);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Image upload failed',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }
}