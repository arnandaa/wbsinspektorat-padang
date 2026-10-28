<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function index(): JsonResponse
    {
        $reports = Report::orderBy('id', 'desc')->get();

        // Convert to array (Accessors will automatically decrypt reporter identity fields)
        $result = $reports->map(function ($r) {
            return [
                'id' => $r->id,
                'token' => $r->token,
                'date_submitted' => $r->date_submitted,
                'is_anonim' => $r->is_anonim,
                'category' => $r->category,
                'title' => $r->title,
                'incident_date' => $r->incident_date,
                'location' => $r->location,
                'description' => $r->description,
                'file_name' => $r->file_name,
                'file_data' => $r->file_data,
                'status' => $r->status,
                'reporter_name' => $r->reporter_name,
                'reporter_nik' => $r->reporter_nik,
                'reporter_email' => $r->reporter_email,
                'reporter_hp' => $r->reporter_hp,
            ];
        });

        return response()->json([
            'success' => true,
            'reports' => $result,
        ]);
    }

    public function updateStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'status' => 'required|string',
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

        $report->status = $validated['status'];
        $report->save();

        ReportHistory::create([
            'report_token' => $report->token,
            'status' => $validated['status'],
            'note' => $validated['note'],
            'date' => now(),
            'is_user_msg' => false,
            'file_name' => $validated['file_name'] ?? null,
            'file_data' => $validated['file_data'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status laporan berhasil diperbarui.',
            'status' => $report->status,
        ]);
    }
}
