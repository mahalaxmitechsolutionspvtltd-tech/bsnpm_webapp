<?php

namespace App\Http\Middleware;

use App\Models\Sanchalaka;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class SanchalakaAuthMiddleware
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

        if (!($user instanceof Sanchalaka)) {
            return response()->json([
                'success' => false,
                'message' => 'Sanchalaka access only'
            ], 403);
        }

        if (($user->status ?? '') !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Sanchalaka account inactive'
            ], 403);
        }

        return $next($request);
    }
}