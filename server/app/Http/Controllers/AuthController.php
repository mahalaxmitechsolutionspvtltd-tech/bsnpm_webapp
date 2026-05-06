<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Sanchalaka;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;
use Throwable;

class AuthController extends Controller
{
    public function __construct(private JwtService $jwtService)
    {
    }

    public function registerAdmin(Request $request): JsonResponse
    {
        $request->validate([
            'admin_name' => 'required',
            'admin_email' => 'required|email|unique:admins,admin_email',
            'admin_mobile' => 'required|unique:admins,admin_mobile',
            'password' => 'required|min:6',
        ]);

        $admin = Admin::create([
            'admin_id' => $request->admin_id,
            'admin_name' => $request->admin_name,
            'admin_email' => $request->admin_email,
            'admin_mobile' => $request->admin_mobile,
            'password' => Hash::make($request->password),
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin created successfully',
            'data' => $admin,
        ]);
    }

    public function adminLogin(Request $request): JsonResponse
    {
        $request->validate([
            'adminId' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $adminId = trim((string) $request->adminId);
        $password = trim((string) $request->password);

        $admin = Admin::where('admin_id', $adminId)
            ->orWhere('admin_email', $adminId)
            ->orWhere('admin_mobile', $adminId)
            ->first();

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        $dbPassword = (string) $admin->password;
        $passwordOk = Hash::check($password, $dbPassword) || $password === trim($dbPassword);

        if (!$passwordOk) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        if (strtolower((string) ($admin->status ?? '')) !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Admin account inactive',
            ], 403);
        }

        $tokens = $this->createTokenPair(
            userId: $admin->id,
            userType: 'admin',
            email: $admin->admin_email,
            name: $admin->admin_name
        );

        return response()->json([
            'success' => true,
            'message' => 'Admin login successful',
            'user_type' => 'admin',
            'access_token' => $tokens['access_token'],
            'expires_in' => $this->jwtService->accessTtlMinutes() * 60,
            'data' => [
                'id' => $admin->id,
                'admin_id' => $admin->admin_id,
                'admin_name' => $admin->admin_name,
                'admin_email' => $admin->admin_email,
                'admin_mobile' => $admin->admin_mobile,
                'profile_photo' => $admin->profile_photo,
                'status' => $admin->status,
            ],
        ])
            ->withCookie($this->makeRefreshCookie($tokens['refresh_token']))
            ->withCookie($this->clearCookie('auth_token'))
            ->withCookie($this->clearCookie('member_token'));
    }

    public function sanchalakaLogin(Request $request): JsonResponse
    {
        $request->validate([
            'sanchalakId' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $sanchalakId = trim((string) $request->sanchalakId);
        $password = trim((string) $request->password);

        $sanchalaka = Sanchalaka::where('sanchalak_id', $sanchalakId)
            ->orWhere('sanchalak_email', $sanchalakId)
            ->orWhere('sanchalak_mobile', $sanchalakId)
            ->first();

        if (!$sanchalaka) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        $dbPassword = trim((string) $sanchalaka->password);
        $passwordOk = Hash::check($password, $dbPassword) || $password === $dbPassword;

        if (!$passwordOk) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        if (strtolower((string) ($sanchalaka->status ?? '')) !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Sanchalaka account inactive',
            ], 403);
        }

        $tokens = $this->createTokenPair(
            userId: $sanchalaka->id,
            userType: 'sanchalaka',
            email: $sanchalaka->sanchalak_email,
            name: $sanchalaka->sanchalak_name
        );

        return response()->json([
            'success' => true,
            'message' => 'Sanchalaka login successful',
            'user_type' => 'sanchalaka',
            'access_token' => $tokens['access_token'],
            'expires_in' => $this->jwtService->accessTtlMinutes() * 60,
            'data' => [
                'id' => $sanchalaka->id,
                'sanchalak_id' => $sanchalaka->sanchalak_id,
                'sanchalak_name' => $sanchalaka->sanchalak_name,
                'sanchalak_email' => $sanchalaka->sanchalak_email,
                'sanchalak_mobile' => $sanchalaka->sanchalak_mobile,
                'profile_photo' => $sanchalaka->profile_photo,
                'status' => $sanchalaka->status,
            ],
        ])
            ->withCookie($this->makeRefreshCookie($tokens['refresh_token']))
            ->withCookie($this->clearCookie('auth_token'))
            ->withCookie($this->clearCookie('member_token'));
    }

    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $request->cookie('refresh_token');

        if (!is_string($refreshToken) || trim($refreshToken) === '') {
            return response()->json([
                'success' => false,
                'message' => 'Refresh token missing',
            ], 401);
        }

        try {
            $payload = $this->jwtService->decodeRefreshToken($refreshToken);

            $userId = $payload['sub'] ?? null;
            $userType = $payload['user_type'] ?? null;

            if (!$userId || !$userType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid refresh token payload',
                ], 401)->withCookie($this->clearCookie('refresh_token'));
            }

            $user = $this->findUserByType((string) $userType, (int) $userId);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 401)->withCookie($this->clearCookie('refresh_token'));
            }

            if (strtolower((string) ($user->status ?? '')) !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Account inactive',
                ], 403)->withCookie($this->clearCookie('refresh_token'));
            }

            $email = $userType === 'admin' ? $user->admin_email : $user->sanchalak_email;
            $name = $userType === 'admin' ? $user->admin_name : $user->sanchalak_name;

            $tokens = $this->createTokenPair(
                userId: $user->id,
                userType: (string) $userType,
                email: $email,
                name: $name
            );

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'user_type' => $userType,
                'access_token' => $tokens['access_token'],
                'expires_in' => $this->jwtService->accessTtlMinutes() * 60,
                'data' => $this->formatUserData($user, (string) $userType),
            ])->withCookie($this->makeRefreshCookie($tokens['refresh_token']));
        } catch (Throwable) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid refresh token',
            ], 401)->withCookie($this->clearCookie('refresh_token'));
        }
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user') ?? $request->user();
        $userType = $request->attributes->get('auth_user_type');

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        if (!$userType) {
            if ($user instanceof Admin) {
                $userType = 'admin';
            }

            if ($user instanceof Sanchalaka) {
                $userType = 'sanchalaka';
            }
        }

        if (!in_array($userType, ['admin', 'sanchalaka'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid authenticated user type',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'user_type' => $userType,
            'data' => $this->formatUserData($user, (string) $userType),
        ]);
    }

    public function logout(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
            'data' => null,
        ])
            ->withCookie($this->clearCookie('refresh_token'))
            ->withCookie($this->clearCookie('auth_token'))
            ->withCookie($this->clearCookie('member_token'))
            ->withCookie(Cookie::forget('laravel_session'))
            ->withCookie(Cookie::forget('XSRF-TOKEN'));
    }

    private function createTokenPair(int|string $userId, string $userType, ?string $email, ?string $name): array
    {
        $payload = [
            'sub' => $userId,
            'user_type' => $userType,
            'email' => $email,
            'name' => $name,
        ];

        return [
            'access_token' => $this->jwtService->generateAccessToken($payload),
            'refresh_token' => $this->jwtService->generateRefreshToken($payload),
        ];
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

    private function formatUserData(Admin|Sanchalaka $user, string $userType): array
    {
        if ($userType === 'admin') {
            return [
                'id' => $user->id,
                'admin_id' => $user->admin_id,
                'admin_name' => $user->admin_name,
                'admin_email' => $user->admin_email,
                'admin_mobile' => $user->admin_mobile,
                'profile_photo' => $user->profile_photo,
                'status' => $user->status,
            ];
        }

        return [
            'id' => $user->id,
            'sanchalak_id' => $user->sanchalak_id,
            'sanchalak_name' => $user->sanchalak_name,
            'sanchalak_email' => $user->sanchalak_email,
            'sanchalak_mobile' => $user->sanchalak_mobile,
            'profile_photo' => $user->profile_photo,
            'status' => $user->status,
        ];
    }

    private function makeRefreshCookie(string $token): SymfonyCookie
    {
        return Cookie::make(
            'refresh_token',
            $token,
            $this->jwtService->refreshTtlMinutes(),
            '/',
            $this->cookieDomain(),
            $this->cookieSecure(),
            true,
            false,
            $this->sameSite()
        );
    }

    private function clearCookie(string $name): SymfonyCookie
    {
        return Cookie::make(
            $name,
            '',
            -1,
            '/',
            $this->cookieDomain(),
            $this->cookieSecure(),
            true,
            false,
            $this->sameSite()
        );
    }

    private function cookieSecure(): bool
    {
        return filter_var(env('JWT_COOKIE_SECURE', false), FILTER_VALIDATE_BOOLEAN);
    }

    private function cookieDomain(): ?string
    {
        $domain = env('JWT_COOKIE_DOMAIN');

        if (!$domain || $domain === 'null') {
            return null;
        }

        return (string) $domain;
    }

    private function sameSite(): string
    {
        return (string) env('COOKIE_SAME_SITE', $this->cookieSecure() ? 'None' : 'Lax');
    }
}