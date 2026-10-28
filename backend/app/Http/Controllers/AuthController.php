<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $ip = $request->ip();
        $throttleKey = 'login-attempt:' . $ip;

        // Proteksi Brute-force: Maksimal 5x percobaan per 15 menit
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Terlalu banyak percobaan login gagal. Akun terkunci sementara selama {$seconds} detik.",
            ], 429);
        }

        $expectedUser = env('ADMIN_USERNAME', 'admin');
        $expectedPassHash = env('ADMIN_PASSWORD_HASH');
        $fallbackPass = env('ADMIN_PASSWORD', 'adminpass');

        $isValidUser = ($validated['username'] === $expectedUser);
        $isValidPass = false;

        if ($expectedPassHash) {
            $normalizedHash = str_starts_with($expectedPassHash, '$2b$') 
                ? '$2y$' . substr($expectedPassHash, 4) 
                : $expectedPassHash;
            $isValidPass = Hash::check($validated['password'], $normalizedHash);
        } else {
            $isValidPass = ($validated['password'] === $fallbackPass);
        }

        if (!$isValidUser || !$isValidPass) {
            RateLimiter::hit($throttleKey, 900); // Hitung percobaan gagal, expire 15 menit
            $remaining = 5 - RateLimiter::attempts($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Kredensial tidak valid. Sisa percobaan: {$remaining} kali.",
            ], 401);
        }

        // Login Berhasil: Bersihkan hitungan rate limiter
        RateLimiter::clear($throttleKey);

        // Generate HMAC SHA-256 Stateless Token (valid 8 jam)
        $sessionSecret = env('SESSION_SECRET', env('APP_KEY', 'default_secret'));
        $payload = [
            'username' => $expectedUser,
            'iat' => time(),
            'exp' => time() + (8 * 3600), // 8 jam
            'random' => Str::random(16)
        ];
        $payloadBase64 = base64_encode(json_encode($payload));
        $signature = hash_hmac('sha256', $payloadBase64, $sessionSecret);
        $token = $payloadBase64 . '.' . $signature;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'token' => $token,
            'username' => $expectedUser,
            'expires_in' => 8 * 3600,
        ]);
    }

    public function logout(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        $expectedPassHash = env('ADMIN_PASSWORD_HASH');
        $fallbackPass = env('ADMIN_PASSWORD', 'adminpass');

        $isValidPass = $expectedPassHash 
            ? Hash::check($validated['old_password'], $expectedPassHash) 
            : ($validated['old_password'] === $fallbackPass);

        if (!$isValidPass) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi saat ini (lama) salah.',
            ], 400);
        }

        // Generate hash baru
        $newHash = Hash::make($validated['new_password'], ['rounds' => 12]);

        // Simpan ke berkas .env
        $envPath = base_path('.env');
        if (file_exists($envPath)) {
            $envContent = file_get_contents($envPath);
            if (str_contains($envContent, 'ADMIN_PASSWORD_HASH=')) {
                $envContent = preg_replace('/ADMIN_PASSWORD_HASH=.*$/m', "ADMIN_PASSWORD_HASH={$newHash}", $envContent);
            } else {
                $envContent .= "\nADMIN_PASSWORD_HASH={$newHash}\n";
            }
            file_put_contents($envPath, $envContent);
        }

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui.',
        ]);
    }
}
