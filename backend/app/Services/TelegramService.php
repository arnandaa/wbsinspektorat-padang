<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    public static function sendReportAlert($report): void
    {
        $botToken = env('TELEGRAM_BOT_TOKEN');
        $chatId = env('TELEGRAM_CHAT_ID');

        if (!$botToken || !$chatId) {
            return;
        }

        $sifat = $report->is_anonim ? 'Anonim (Identitas Dirahasiakan)' : 'Bernama (Dilindungi Hukum)';
        $hasAttachment = $report->file_name ? "Ada ({$report->file_name})" : 'Tidak Ada';

        $text = "🚨 *PENGADUAN WBS BARU DITERIMA* 🚨\n";
        $text .= "Inspektorat Daerah Kota Padang\n\n";
        $text .= "*Token:* `{$report->token}`\n";
        $text .= "*Kategori:* {$report->category}\n";
        $text .= "*Judul:* {$report->title}\n";
        $text .= "*Lokasi:* {$report->location}\n";
        $text .= "*Sifat:* {$sifat}\n";
        $text .= "*Lampiran:* {$hasAttachment}\n";
        $text .= "*Waktu:* {$report->date_submitted}\n\n";
        $text .= "Silakan verifikasi melalui Dashboard Admin WBS.";

        try {
            Http::timeout(5)->post("https://api.telegram.org/bot{$botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'Markdown',
            ]);
        } catch (\Exception $e) {
            Log::warning("Gagal mengirim Telegram alert: " . $e->getMessage());
        }
    }
}
