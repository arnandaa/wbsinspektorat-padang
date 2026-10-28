<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Autentikasi diperlukan.',
            ], 401);
        }

        $token = substr($authHeader, 7);
        $parts = explode('.', $token);

        if (count($parts) !== 2) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak valid.',
            ], 401);
        }

        [$payloadBase64, $signature] = $parts;
        $sessionSecret = env('SESSION_SECRET', env('APP_KEY', 'default_secret'));
        $expectedSignature = hash_hmac('sha256', $payloadBase64, $sessionSecret);

        if (!hash_equals($expectedSignature, $signature)) {
            return response()->json([
                'success' => false,
                'message' => 'Tanda tangan token tidak sah.',
            ], 401);
        }

        $payload = json_decode(base64_decode($payloadBase64), true);

        if (!$payload || !isset($payload['exp']) || time() > $payload['exp']) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi telah kedaluwarsa. Silakan login kembali.',
            ], 401);
        }

        return $next($request);
    }
}
