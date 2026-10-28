<?php

use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TrackingController;
use Illuminate\Support\Facades\Route;

// 1. PUBLIC ENDPOINTS
Route::post('/reports', [ReportController::class, 'store']);
Route::get('/reports/stats', [ReportController::class, 'stats']);
Route::get('/reports/track/{token}', [TrackingController::class, 'show']);
Route::post('/reports/comment', [TrackingController::class, 'addComment']);
Route::post('/login', [AuthController::class, 'login']);

// 2. PROTECTED ADMIN ENDPOINTS
Route::middleware('admin.auth')->group(function () {
    Route::post('/admin/logout', [AuthController::class, 'logout']);
    Route::post('/admin/change-password', [AuthController::class, 'changePassword']);
    Route::get('/admin/reports', [AdminReportController::class, 'index']);
    Route::post('/admin/reports/update-status', [AdminReportController::class, 'updateStatus']);
});
