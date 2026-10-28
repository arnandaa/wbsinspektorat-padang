import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ShieldCheck, 
  FileText, 
  Search, 
  Lock, 
  EyeOff, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Coins,
  Gift,
  Briefcase,
  UserX,
  FileSpreadsheet,
  ArrowRight,
  Building2,
  Scale
} from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    process: 0,
    resolved: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    api.get('/reports/stats')
      .then((res) => {
        if (res.data.success) {
          setStats({
            total: res.data.total ?? 0,
            pending: res.data.pending ?? 0,
            process: res.data.process ?? 0,
            resolved: res.data.resolved ?? 0,
          });
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat statistik:', err);
      })
      .finally(() => {
        setLoadingStats(false);
      });
  }, []);

  const categories = [
    { title: "Korupsi / Kerugian Keuangan", icon: Coins, desc: "Penyalahgunaan anggaran daerah, manipulasi pengadaan barang/jasa, atau mark-up belanja dinas." },
    { title: "Pungutan Liar (Pungli)", icon: AlertTriangle, desc: "Permintaan biaya tidak resmi dalam pelayanan administrasi kependudukan, perizinan, atau retribusi." },
    { title: "Gratifikasi & Suap", icon: Gift, desc: "Penerimaan fasilitas, suvenir berharga, komisi, atau uang pelicin terkait kewenangan kedinasan." },
    { title: "Penyalahgunaan Wewenang", icon: Briefcase, desc: "Tindakan di luar batas wewenang demi kepentingan pribadi, keluarga, atau benturan kepentingan." },
    { title: "Pelanggaran Disiplin ASN", icon: UserX, desc: "Indisipliner kehadiran, pelanggaran netralitas pemilu/pilkada, atau pelanggaran kode etik kepegawaian." },
    { title: "Pelayanan Publik Maladministrasi", icon: FileSpreadsheet, desc: "Penundaan berlarut tanpa alasan sah, diskriminasi pelayanan warga, atau kelalaian pemenuhan SOP." }
  ];

  const workflowSteps = [
    { num: "01", title: "Penyampaian Laporan", desc: "Isi formulir kronologi lengkap (5W+1H), pilih identitas anonim atau rahasia, serta unggah dokumen bukti pendukung." },
    { num: "02", title: "Penerbitan Kode Rahasia", desc: "Sistem menerbitkan Token Pelacakan unik (contoh: WBS-PADANG-XXXXXX) sebagai kunci tunggal akses progres Anda." },
    { num: "03", title: "Verifikasi Awal", desc: "Tim Verifikator Inspektorat memeriksa kejelasan dan kelayakan substansi laporan dalam 1–3 hari kerja." },
    { num: "04", title: "Audit Investigatif", desc: "Tim Auditor ditugaskan melakukan telaah lapangan dan klarifikasi pihak terkait bila dugaan terbukti beralasan kuat." },
    { num: "05", title: "Rekomendasi Tindak Lanjut", desc: "Laporan Hasil Audit disampaikan kepada Inspektur Kota Padang untuk penetapan sanksi disiplin atau pelimpahan APH." },
    { num: "06", title: "Penyelesaian & Arsip", desc: "Hasil penanganan dilaporkan secara transparan melalui modul pelacakan token pelapor." }
  ];

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. HERO SECTION (INSTITUTIONAL NAVY & GOLD ACCENT - ANTI-SLOP COMPLIANT) */}
      <section className="bg-[#0B192C] text-white border-b border-slate-800 pt-14 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            
            {/* Badge Otoritas Resmi */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-700 text-xs font-medium text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Inspektorat Daerah Pemerintah Kota Padang</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-semibold">Saluran Resmi Pengawasan</span>
            </div>

            {/* Heading Utama (Solid White & Gold, Anti AI-Gradient) */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight font-heading">
                Saluran Pengaduan Pelanggaran Integritas Aparatur
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                Laporkan indikasi tindak pidana korupsi, pungutan liar, gratifikasi, dan penyalahgunaan wewenang di lingkungan Pemerintah Kota Padang. Kami menjamin kerahasiaan identitas pelapor sesuai Undang-Undang Perlindungan Saksi dan Korban serta regulasi perlindungan data pribadi.
              </p>
            </div>

            {/* CTA Buttons (Deliberate rounded-md, High Contrast) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                to="/lapor"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                Buat Pengaduan Sekarang
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>

              <Link
                to="/lacak"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-sm transition-colors"
              >
                <Search className="w-4 h-4 text-amber-500" />
                Lacak Status Pengaduan
              </Link>
            </div>

            {/* Jaminan Keamanan & Enkripsi */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-md py-2 px-3">
                <EyeOff className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Opsi 100% Pelapor Anonim</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-md py-2 px-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kerahasiaan Dijamin Regulasi</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-md py-2 px-3">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Enkripsi Database AES-256</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATISTIK PENANGANAN REAL-TIME (CLEAN INSTITUTIONAL CARDS) */}
      <section className="-mt-12 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-6 sm:p-7 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 mb-5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-heading">
                Rekapitulasi Penanganan Pengaduan Publik
              </h2>
              <p className="text-xs text-slate-500">
                Pembaruan otomatis dari pangkalan data terintegrasi Inspektorat Kota Padang
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Data Sinkron</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 border-t-2 border-t-slate-800">
              <p className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
                {loadingStats ? '-' : stats.total}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-1">Total Laporan Masuk</p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 border-t-2 border-t-amber-500">
              <p className="text-2xl sm:text-3xl font-bold font-heading text-amber-700">
                {loadingStats ? '-' : stats.pending}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-1">Menunggu Verifikasi</p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 border-t-2 border-t-blue-600">
              <p className="text-2xl sm:text-3xl font-bold font-heading text-blue-800">
                {loadingStats ? '-' : stats.process}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-1">Dalam Penelaahan</p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 border-t-2 border-t-emerald-600">
              <p className="text-2xl sm:text-3xl font-bold font-heading text-emerald-700">
                {loadingStats ? '-' : stats.resolved}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-1">Selesai Ditindaklanjuti</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. JENIS PELANGGARAN YANG DAPAT DILAPORKAN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded">
            <Scale className="w-3.5 h-3.5 text-rose-700" />
            <span>Ruang Lingkup Pengaduan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
            Klasifikasi Dugaan Pelanggaran
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Pengaduan yang dapat ditindaklanjuti merupakan indikasi pelanggaran yang berkaitan dengan tugas, wewenang, dan aparatur di lingkungan Pemerintah Kota Padang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-800" />
                  </div>
                  <h3 className="font-heading font-semibold text-base text-slate-900">
                    {cat.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Link 
                    to="/lapor"
                    className="inline-flex items-center text-xs font-semibold text-blue-900 hover:text-blue-700"
                  >
                    <span>Laporkan dugaan ini</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ALUR TAHAPAN PENANGANAN (6 TAHAP STANDAR AUDIT) */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Prosedur Operasional Standar
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
              Alur Penanganan Laporan Pengaduan
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Setiap pengaduan diproses secara akuntabel dan berjenjang melalui 6 tahapan pemeriksaan oleh Aparat Pengawasan Intern Pemerintah (APIP).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
                    Tahap {step.num}
                  </span>
                </div>
                <h4 className="font-heading font-semibold text-base text-slate-900">
                  {step.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. JAMINAN PRIVASI DAN KONSISTENSI HUKUM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B192C] text-white rounded-lg p-7 sm:p-10 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Perlindungan Hak Pelapor</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Kerahasiaan Identitas Pelapor Dijamin Undang-Undang
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Inspektorat Kota Padang terikat kewajiban hukum untuk merahasiakan identitas pelapor dan substansi laporan. Sistem tidak mencatat identitas IP Anda saat menggunakan opsi laporan anonim.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 shrink-0 w-full sm:w-auto">
            <Link
              to="/lapor"
              className="inline-flex items-center justify-center px-5 py-3 rounded-md text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
            >
              Mulai Buat Pengaduan
            </Link>
            <Link
              to="/lacak"
              className="inline-flex items-center justify-center px-5 py-3 rounded-md text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
            >
              Lacak Pengaduan Saya
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
