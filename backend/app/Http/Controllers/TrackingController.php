<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $report = Report::where('token', strtoupper(trim($token)))->first();

        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan dengan token tersebut tidak ditemukan.',
            ], 404);
        }

        $history = $report->history()->get();

        // Sembunyikan data identitas pribadi untuk endpoint pelacakan publik jika anonim
        $reportData = $report->toArray();
        if ($report->is_anonim) {
            unset($reportData['reporter_name'], $reportData['reporter_nik'], $reportData['reporter_email'], $reportData['reporter_hp']);
        }

        return response()->json([
            'success' => true,
            'report' => $reportData,
            'history' => $history,
        ]);
    }

    public function addComment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'note' => 'required|string',
            'file_name' => 'nullable|string',
            'file_data' => 'nullable|string',
        ]);

        $report = Report::where('token', strtoupper(trim($validated['token'])))->first();

        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        $historyItem = ReportHistory::create([
            'report_token' => $report->token,
            'status' => $report->status,
            'note' => $validated['note'],
            'date' => now(),
            'is_user_msg' => true,
            'file_name' => $validated['file_name'] ?? null,
            'file_data' => $validated['file_data'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pesan balasan berhasil ditambahkan ke linimasa.',
            'history' => $historyItem,
        ]);
    }
}
