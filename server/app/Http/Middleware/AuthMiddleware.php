<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Sanchalaka;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuthMiddleware
{
    public function __construct(private JwtService $jwtService)
    {
    }

    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $token = $this->getBearerToken($request);

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        try {
            $payload = $this->jwtService->decodeAccessToken($token);

            $userId = $payload['sub'] ?? null;
            $userType = $payload['user_type'] ?? null;

            if (!$userId || !$userType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $user = $this->findUserByType((string) $userType, (int) $userId);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            if (strtolower((string) ($user->status ?? '')) !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Account inactive',
                ], 403);
            }

            $request->setUserResolver(function () use ($user) {
                return $user;
            });

            $request->attributes->set('auth_user', $user);
            $request->attributes->set('auth_user_type', $userType);
            $request->attributes->set('jwt_payload', $payload);

            return $next($request);
        } catch (Throwable) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }
    }

    private function getBearerToken(Request $request): ?string
    {
        $authorizationHeader = $request->header('Authorization');

        if (!$authorizationHeader || !str_starts_with($authorizationHeader, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($authorizationHeader, 7));

        return $token !== '' ? $token : null;
    }

    private function findUserByType(string $userType, int $userId): Admin|Sanchalaka|null
    {
        if ($userType === 'admin') {
            return Admin::query()->find($userId);
        }

        if ($userType === 'sanchalaka') {
            return Sanchalaka::query()->find($userId);
        }

        return null;
    }
}