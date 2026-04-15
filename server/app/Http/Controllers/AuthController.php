<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Sanchalaka;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{

    public function registerAdmin(Request $request)
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
            'status' => 'active'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin created successfully',
            'data' => $admin
        ]);
    }
    public function adminLogin(Request $request)
    {
        $request->validate([
            'adminId' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $adminId = trim($request->adminId);
        $password = trim($request->password);

        $admin = Admin::where('admin_id', $adminId)
            ->orWhere('admin_email', $adminId)
            ->orWhere('admin_mobile', $adminId)
            ->first();

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $dbPassword = (string) $admin->password;
        $passwordOk = Hash::check($password, $dbPassword) || $password === trim($dbPassword);

        if (!$passwordOk) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (strtolower((string) ($admin->status ?? '')) !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Admin account inactive'
            ], 403);
        }

        $admin->tokens()->delete();

        $token = $admin->createToken('admin-token')->plainTextToken;
        $cookie = Cookie::make(
            'auth_token',
            $token,
            720,
            '/',
            null,
            filter_var(env('SESSION_SECURE_COOKIE', false), FILTER_VALIDATE_BOOLEAN),
            true,
            false,
            env('COOKIE_SAME_SITE', 'lax')
        );

        return response()->json([
            'success' => true,
            'message' => 'Admin login successful',
            'user_type' => 'admin',
            'data' => [
                'id' => $admin->id,
                'admin_id' => $admin->admin_id,
                'admin_name' => $admin->admin_name,
                'admin_email' => $admin->admin_email,
                'admin_mobile' => $admin->admin_mobile,
                'profile_photo' => $admin->profile_photo,
                'status' => $admin->status,
            ]
        ])->withCookie($cookie);
    }

    public function sanchalakaLogin(Request $request)
    {
        $request->validate([
            'sanchalakId' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $sanchalakId = trim($request->sanchalakId);
        $password = trim($request->password);

        $sanchalaka = Sanchalaka::where('sanchalak_id', $sanchalakId)
            ->orWhere('sanchalak_email', $sanchalakId)
            ->orWhere('sanchalak_mobile', $sanchalakId)
            ->first();

        if (!$sanchalaka) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $dbPassword = trim((string) $sanchalaka->password);
        $passwordOk = Hash::check($password, $dbPassword) || $password === $dbPassword;

        if (!$passwordOk) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (strtolower((string) ($sanchalaka->status ?? '')) !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Sanchalaka account inactive'
            ], 403);
        }

        $sanchalaka->tokens()->delete();

        $token = $sanchalaka->createToken('sanchalaka-token')->plainTextToken;

        $cookie = Cookie::make(
            'auth_token',
            $token,
            720,
            '/',
            null,
            false,
            true,
            false,
            'Lax'
        );

        return response()->json([
            'success' => true,
            'message' => 'Sanchalaka login successful',
            'user_type' => 'sanchalaka',
            'data' => [
                'id' => $sanchalaka->id,
                'sanchalak_id' => $sanchalaka->sanchalak_id,
                'sanchalak_name' => $sanchalaka->sanchalak_name,
                'sanchalak_email' => $sanchalaka->sanchalak_email,
                'sanchalak_mobile' => $sanchalaka->sanchalak_mobile,
                'profile_photo' => $sanchalaka->profile_photo,
                'status' => $sanchalaka->status,
            ]
        ])->withCookie($cookie);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $userType = 'unknown';

        if ($user instanceof Admin) {
            $userType = 'admin';
        }

        if ($user instanceof Sanchalaka) {
            $userType = 'sanchalaka';
        }

        return response()->json([
            'success' => true,
            'user_type' => $userType,
            'data' => $user,
        ]);
    }



    public function logout(Request $request)
    {
        $member = $request->user();

        if (!$member) {
            $response = response()->json([
                'success' => false,
                'message' => 'Member not authenticated.',
                'data' => null,
            ], 401);

            return $response
                ->withCookie(Cookie::forget('auth_token'))
                ->withCookie(Cookie::forget('member_token'))
                ->withCookie(Cookie::forget('laravel_session'))
                ->withCookie(Cookie::forget('XSRF-TOKEN'));
        }

        if (method_exists($member, 'currentAccessToken') && $member->currentAccessToken()) {
            $member->currentAccessToken()->delete();
        }

        if (method_exists($member, 'tokens')) {
            $tokenValue = $request->bearerToken();

            if ($tokenValue) {
                $member->tokens()
                    ->where('token', hash('sha256', $tokenValue))
                    ->delete();
            }
        }

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $response = response()->json([
            'success' => true,
            'message' => 'Member logged out successfully.',
            'data' => [
                'member_id' => $member->member_id ?? null,
                'member_name' => $member->full_name ?? null,
            ],
        ], 200);

        return $response
            ->withCookie(Cookie::forget('auth_token'))
            ->withCookie(Cookie::forget('member_token'))
            ->withCookie(Cookie::forget('laravel_session'))
            ->withCookie(Cookie::forget('XSRF-TOKEN'));
    }

}