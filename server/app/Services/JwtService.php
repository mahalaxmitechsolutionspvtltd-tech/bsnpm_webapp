<?php

namespace App\Services;

use Carbon\Carbon;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use RuntimeException;

class JwtService
{
    private string $accessSecret;
    private string $refreshSecret;
    private int $accessTtlMinutes;
    private int $refreshTtlDays;
    private string $algorithm;

    public function __construct()
    {
        $accessSecret = (string) env('JWT_ACCESS_SECRET', '');
        $refreshSecret = (string) env('JWT_REFRESH_SECRET', '');
        $accessTtlMinutes = (int) env('JWT_ACCESS_TTL_MINUTES', 15);
        $refreshTtlDays = (int) env('JWT_REFRESH_TTL_DAYS', 30);

        if (strlen($accessSecret) < 32) {
            throw new RuntimeException('JWT_ACCESS_SECRET must be at least 32 characters.');
        }

        if (strlen($refreshSecret) < 32) {
            throw new RuntimeException('JWT_REFRESH_SECRET must be at least 32 characters.');
        }

        $this->accessSecret = $accessSecret;
        $this->refreshSecret = $refreshSecret;
        $this->accessTtlMinutes = $accessTtlMinutes > 0 ? $accessTtlMinutes : 15;
        $this->refreshTtlDays = $refreshTtlDays > 0 ? $refreshTtlDays : 30;
        $this->algorithm = 'HS256';
    }

    public function generateAccessToken(array $payload): string
    {
        return $this->generateToken(
            array_merge($payload, ['type' => 'access']),
            $this->accessSecret,
            Carbon::now()->addMinutes($this->accessTtlMinutes)->timestamp
        );
    }

    public function generateRefreshToken(array $payload): string
    {
        return $this->generateToken(
            array_merge($payload, ['type' => 'refresh']),
            $this->refreshSecret,
            Carbon::now()->addDays($this->refreshTtlDays)->timestamp
        );
    }

    public function decodeAccessToken(string $token): array
    {
        $payload = $this->decodeToken($token, $this->accessSecret);

        if (($payload['type'] ?? null) !== 'access') {
            throw new RuntimeException('Invalid token type.');
        }

        return $payload;
    }

    public function decodeRefreshToken(string $token): array
    {
        $payload = $this->decodeToken($token, $this->refreshSecret);

        if (($payload['type'] ?? null) !== 'refresh') {
            throw new RuntimeException('Invalid token type.');
        }

        return $payload;
    }

    public function accessTtlMinutes(): int
    {
        return $this->accessTtlMinutes;
    }

    public function refreshTtlMinutes(): int
    {
        return $this->refreshTtlDays * 24 * 60;
    }

    private function generateToken(array $payload, string $secret, int $expiresAt): string
    {
        $now = Carbon::now()->timestamp;

        $body = array_merge($payload, [
            'iat' => $now,
            'nbf' => $now,
            'exp' => $expiresAt,
            'iss' => config('app.url'),
            'jti' => bin2hex(random_bytes(16)),
        ]);

        return JWT::encode($body, $secret, $this->algorithm);
    }

    private function decodeToken(string $token, string $secret): array
    {
        $decoded = JWT::decode($token, new Key($secret, $this->algorithm));
        $payload = json_decode(json_encode($decoded, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);

        if (!is_array($payload)) {
            throw new RuntimeException('Invalid token payload.');
        }

        return $payload;
    }
}