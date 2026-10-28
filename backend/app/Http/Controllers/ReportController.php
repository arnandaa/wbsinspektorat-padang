<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportHistory;
use App\Services\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'required|string|max:150',
            'title' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'description' => 'required|string',
            'is_anonim' => 'boolean',
            'incident_date' => 'nullable|string',
            'file_name' => 'nullable|string',
            'file_data' => 'nullable|string',
            'reporter_name' => 'nullable|string',
            'reporter_nik' => 'nullable|string',
            'reporter_email' => 'nullable|string',
            'reporter_hp' => 'nullable|string',
        ]);

        // Generate cryptographically secure unique token (Format: WBS-PADANG-XXXXXX)
        do {
            $token = 'WBS-PADANG-' . Str::upper(Str::random(6));
        } while (Report::where('token', $token)->exists());

        $report = Report::create([
            'token' => $token,
            'date_submitted' => now(),
            'is_anonim' => $validated['is_anonim'] ?? true,
            'category' => $validated['category'],
            'title' => $validated['title'],
            'incident_date' => $validated['incident_date'] ?? null,
            'location' => $validated['location'],
            'description' => $validated['description'],
            'file_name' => $validated['file_name'] ?? null,
            'file_data' => $validated['file_data'] ?? null,
            'status' => 'Diajukan',
            'reporter_name' => $validated['reporter_name'] ?? null,
            'reporter_nik' => $validated['reporter_nik'] ?? null,
            'reporter_email' => $validated['reporter_email'] ?? null,
            'reporter_hp' => $validated['reporter_hp'] ?? null,
        ]);

        // Catatan awal pada linimasa riwayat
        ReportHistory::create([
            'report_token' => $token,
            'status' => 'Diajukan',
            'note' => 'Pengaduan berhasil diajukan dan sedang menunggu verifikasi oleh Tim Inspektorat Daerah Kota Padang.',
            'date' => now(),
            'is_user_msg' => false,
        ]);

        // Notifikasi Instan via Telegram Bot
        TelegramService::sendReportAlert($report);

        return response()->json([
            'success' => true,
            'message' => 'Pengaduan berhasil diajukan.',
            'token' => $token,
        ], 201);
    }

    public function stats(): JsonResponse
    {
        $total = Report::count();
        $pending = Report::where('status', 'Diajukan')->count();
        $process = Report::where('status', 'Diproses')->count();
        $resolved = Report::whereIn('status', ['Ditindaklanjuti', 'Selesai'])->count();

        return response()->json([
            'success' => true,
            'total' => $total,
            'pending' => $pending,
            'process' => $process,
            'resolved' => $resolved,
        ]);
    }
}
