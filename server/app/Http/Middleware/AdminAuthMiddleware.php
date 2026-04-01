<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('auth_token');

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $accessToken = PersonalAccessToken::findToken($token);

        if (!$accessToken || !$accessToken->tokenable) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $user = $accessToken->tokenable;

        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        if (!($user instanceof Admin)) {
            return response()->json([
                'success' => false,
                'message' => 'Admin access only'
            ], 403);
        }

        if (($user->status ?? '') !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Admin account inactive'
            ], 403);
        }

        return $next($request);
    }
}