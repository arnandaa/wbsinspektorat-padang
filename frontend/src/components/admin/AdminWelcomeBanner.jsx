import React, { useMemo } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Download, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export default function AdminWelcomeBanner({ 
  adminUser, 
  stats, 
  loading, 
  onRefresh, 
  onExportCsv 
}) {
  // Determine greeting based on current hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  const currentDateFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date());
    } catch {
      return 'Hari ini';
    }
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg bg-[#0B192C] text-white border border-slate-800 shadow-sm p-6 sm:p-7">
      
      {/* Decorative Structural Grid Background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(217, 119, 6, 0.4) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left Side: Greeting & Authority Info */}
        <div className="space-y-3 max-w-2xl">
          
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-medium">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Inspektorat Kota Padang</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-medium font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDateFormatted}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 font-medium">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>AES-256 Proteksi Data Aktif</span>
            </span>
          </div>

          {/* Headline Title */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-heading text-white tracking-tight leading-tight">
              {greeting}, <span className="text-amber-400">{adminUser?.username || 'Petugas Auditor'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1">
              Portal Komando Pengawasan Whistleblowing System. Periksa berkas pengaduan masuk, lakukan verifikasi awal, dan terbitkan rekomendasi audit investigatif secara akuntabel.
            </p>
          </div>

          {/* Urgent Alert Banner Ticker if there are pending reports */}
          {stats.diajukan > 0 ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-950/70 border border-amber-800/80 text-amber-300 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
              <span>
                Terdapat <strong>{stats.diajukan} laporan baru</strong> yang sedang menunggu verifikasi awal Anda.
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Seluruh laporan masuk telah diverifikasi dan tertangani dengan baik.</span>
            </div>
          )}

        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-2.5 shrink-0">
          
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-colors"
            title="Unduh seluruh rekap pengaduan ke format CSV"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Rekap CSV</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-sm transition-colors disabled:opacity-50"
            title="Sinkronisasi pangkalan data Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
          </button>

        </div>

      </div>

    </div>
  );
}
