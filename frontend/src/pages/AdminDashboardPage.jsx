import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  LayoutDashboard, 
  BarChart2, 
  Database, 
  HelpCircle, 
  Settings, 
  User, 
  LogOut, 
  Search, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Download, 
  X, 
  ArrowUpRight, 
  MoreVertical, 
  Check, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  Building2,
  FolderLock,
  BookOpen,
  KeyRound,
  Filter,
  ChevronRight,
  Info,
  Sparkles,
  Upload,
  PieChart as PieIcon,
  ShieldAlert
} from 'lucide-react';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, adminUser } = useAuth();

  // Active Navigation State: 'Dashboard' | 'Analytics' | 'Databases' | 'Help' | 'Settings' | 'Profile'
  const [activeNav, setActiveNav] = useState('Dashboard');

  // Reports Data State
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Checklist Tasks State
  const [tasks, setTasks] = useState([
    { id: 1, text: "Telaah kelengkapan unsur 5W+1H pengaduan", completed: true },
    { id: 2, text: "Uji keabsahan bukti awal foto / dokumen", completed: true },
    { id: 3, text: "Klarifikasi fakta lapangan pihak terlapor", completed: true },
    { id: 4, text: "Koordinasi telaah bersama Tim APIP Padang", completed: false },
    { id: 5, text: "Penerbitan Laporan Hasil Pemeriksaan (LHP)", completed: true },
  ]);

  // Modals state
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusModalReport, setStatusModalReport] = useState(null);
  const [newStatus, setNewStatus] = useState('Diproses');
  const [statusNote, setStatusNote] = useState('');
  const [statusFile, setStatusFile] = useState(null);
  const [statusFileBase64, setStatusFileBase64] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusErrorMsg, setStatusErrorMsg] = useState('');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Change Password State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
      return;
    }
    fetchReports();
  }, [isAuthenticated, navigate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports');
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data pengaduan:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics Calculation
  const stats = useMemo(() => {
    const total = reports.length;
    const diajukan = reports.filter(r => r.status === 'Diajukan').length;
    const diproses = reports.filter(r => r.status === 'Diproses').length;
    const ditindaklanjuti = reports.filter(r => r.status === 'Ditindaklanjuti').length;
    const selesai = reports.filter(r => r.status === 'Selesai').length;
    const anonim = reports.filter(r => r.is_anonim || r.isAnonim).length;
    const bernama = total - anonim;

    // Categories breakdown
    const categoriesMap = {};
    reports.forEach(r => {
      const cat = r.category || 'Lainnya';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    });

    return { 
      total, 
      diajukan, 
      diproses, 
      ditindaklanjuti, 
      selesai, 
      anonim, 
      bernama,
      categoriesMap
    };
  }, [reports]);

  // Filtered reports for table
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (r.token && r.token.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.location && r.location.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [reports, filterStatus, searchQuery]);

  // Dynamic greeting based on current time
  const dynamicGreeting = useMemo(() => {
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

  // Export CSV Handler
  const exportCsv = () => {
    if (!reports.length) {
      alert('Tidak ada data laporan untuk diekspor.');
      return;
    }
    const headers = ['Token', 'Tanggal', 'Kategori', 'Judul', 'Lokasi/OPD', 'Tipe Pelapor', 'Status'];
    const rows = reports.map(r => [
      `"${r.token}"`,
      `"${r.date || r.date_submitted || ''}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${r.is_anonim ? 'Anonim' : 'Bernama'}"`,
      `"${r.status || ''}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WBS_Padang_Rekap_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Status Modal Handlers
  const handleStatusFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatusErrorMsg('');
    if (file.size > 10 * 1024 * 1024) {
      setStatusErrorMsg('Ukuran berkas maksimal adalah 10MB.');
      return;
    }
    setStatusFile(file);
    const reader = new FileReader();
    reader.onload = () => setStatusFileBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    setStatusErrorMsg('');
    if (!statusNote.trim()) {
      setStatusErrorMsg('Catatan resmi tindak lanjut wajib diisi.');
      return;
    }
    setUpdatingStatus(true);
    try {
      const payload = {
        token: statusModalReport.token,
        status: newStatus,
        note: statusNote.trim(),
        file_name: statusFile ? statusFile.name : null,
        file_data: statusFileBase64 || null,
      };
      const res = await api.post('/admin/reports/update-status', payload);
      if (res.data.success) {
        setStatusModalReport(null);
        setStatusNote('');
        setStatusFile(null);
        setStatusFileBase64('');
        setStatusErrorMsg('');
        fetchReports();
      } else {
        setStatusErrorMsg(res.data.message || 'Gagal memperbarui status.');
      }
    } catch (err) {
      setStatusErrorMsg(err.response?.data?.message || 'Terjadi kesalahan server saat memperbarui status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    setChangingPassword(true);
    try {
      const res = await api.post('/admin/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      if (res.data.success) {
        setPasswordMsg({ type: 'success', text: 'Kata sandi berhasil diperbarui!' });
        setTimeout(() => {
          setPasswordModalOpen(false);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordMsg({ type: '', text: '' });
        }, 1500);
      } else {
        setPasswordMsg({ type: 'error', text: res.data.message || 'Gagal mengubah kata sandi.' });
      }
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mengubah kata sandi.' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0D0E12] text-white font-sans antialiased selection:bg-[#FF6B4A] selection:text-white">
      
      {/* =========================================================================
          1. SLEEK DARK SIDEBAR (CMSolutions Style)
          ========================================================================= */}
      <aside className="w-64 shrink-0 bg-[#12131A] border-r border-[#1E2029] flex flex-col justify-between py-6 px-4">
        <div className="space-y-8">
          
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B4A] to-[#FF8E72] flex items-center justify-center shadow-lg shadow-[#FF6B4A]/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-base tracking-tight text-white block leading-tight">
                CMSolutions
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                WBS Inspektorat
              </span>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
              { id: 'Analytics', label: 'Analytics', icon: BarChart2, badge: null },
              { id: 'Databases', label: 'Databases', icon: Database, badge: stats.total > 0 ? stats.total : null },
              { id: 'Help', label: 'Help', icon: HelpCircle, badge: null },
              { id: 'Settings', label: 'Settings', icon: Settings, badge: null },
              { id: 'Profile', label: 'Profile', icon: User, badge: null },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-[#222430] text-white shadow-inner font-bold' 
                      : 'text-[#8B8D97] hover:text-white hover:bg-[#181922]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#FF6B4A]' : 'text-[#8B8D97]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-[#FF6B4A] text-white' : 'bg-[#222430] text-[#8B8D97]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout at Bottom */}
        <div className="pt-4 border-t border-[#1E2029] space-y-2">
          <div 
            onClick={() => setActiveNav('Profile')}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#181922] transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF6B4A] to-[#FF8E72] flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0">
              {adminUser?.username ? adminUser.username.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF6B4A] transition-colors">
                {adminUser?.username || 'Admin APIP'}
              </p>
              <p className="text-[10px] text-[#8B8D97] truncate">
                Inspektorat Padang
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8B8D97] hover:text-[#FF6B4A] hover:bg-[#181922] transition-colors"
          >
            <LogOut className="w-4 h-4 text-[#8B8D97]" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA (Smooth Slide-Up Transitions)
          ========================================================================= */}
      <main className="flex-1 min-w-0 px-6 sm:px-8 py-6 space-y-6 overflow-y-auto">
        
        {/* Top Header: Breadcrumbs, Action Buttons, & Avatar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#8B8D97] tracking-wide">Pages / {activeNav}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-white">
              {activeNav === 'Dashboard' && 'Main Dashboard'}
              {activeNav === 'Analytics' && 'Statistik & Analisis Kinerja'}
              {activeNav === 'Databases' && 'Database Seluruh Pengaduan'}
              {activeNav === 'Help' && 'Panduan Verifikator & SOP APIP'}
              {activeNav === 'Settings' && 'Pengaturan Keamanan & Sandi'}
              {activeNav === 'Profile' && 'Profil Verifikator APIP'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#222430] hover:bg-[#2A2C3A] text-white border border-[#2C2E3C] transition-colors"
              title="Unduh seluruh rekap pengaduan ke CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#FF6B4A]" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={fetchReports}
              disabled={loading}
              className="p-2 rounded-lg bg-[#222430] hover:bg-[#2A2C3A] text-slate-300 border border-[#2C2E3C] transition-colors"
              title="Segarkan data dari Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF6B4A]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('Profile')}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF6B4A] to-[#FF8E72] flex items-center justify-center font-bold text-xs text-white ring-2 ring-[#222430]"
              title="Buka Profil"
            >
              {adminUser?.username ? adminUser.username.slice(0, 2).toUpperCase() : 'AD'}
            </button>
          </div>
        </div>

        {/* Dynamic Menu View Switching with Smooth Slide-Up Animation */}
        <div key={activeNav} className="animate-admin-slide-up space-y-6">

          {/* ===================================================================
              VIEW 1: DASHBOARD (Ringkasan Eksekutif, Visualisasi & Rekap)
              =================================================================== */}
          {activeNav === 'Dashboard' && (
            <>
              {/* Executive Welcome Hero Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-[#161722] via-[#1A1C28] to-[#161722] border border-[#232432] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#FF6B4A]/10 to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#222432] text-slate-300 border border-[#2F3142]">
                      <Building2 className="w-3 h-3 text-[#FF6B4A]" />
                      Inspektorat Kota Padang
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-[#222432] border border-[#2F3142]">
                      <Clock className="w-3 h-3" />
                      {currentDateFormatted}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      <Lock className="w-2.5 h-2.5" />
                      AES-256 Proteksi Data Aktif
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
                    {dynamicGreeting}, <span className="text-[#FF6B4A]">{adminUser?.username || 'Auditor Pengawas'}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8B8D97] max-w-2xl leading-relaxed">
                    Pusat kendali operasional Whistleblowing System (WBS). Pantau tren investigasi, lakukan telaah awal 5W+1H, dan kelola laporan masuk secara transparan dan akuntabel.
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveNav('Databases')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FF6B4A] hover:bg-[#ff7b5c] text-white shadow-lg shadow-[#FF6B4A]/25 transition-all"
                  >
                    <FolderLock className="w-3.5 h-3.5" />
                    <span>Buka Database Pengaduan</span>
                  </button>
                </div>
              </div>

              {/* 6 Top Metric KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {[
                  { label: "Total Laporan", value: stats.total, icon: BarChart2, iconBg: "bg-slate-800 text-slate-300" },
                  { label: "Menunggu Telaah", value: stats.diajukan, icon: AlertCircle, iconBg: "bg-amber-950/60 text-amber-400" },
                  { label: "Sedang Diteliti", value: stats.diproses, icon: FileText, iconBg: "bg-blue-950/60 text-blue-400" },
                  { label: "Investigasi Aktif", value: stats.ditindaklanjuti, icon: Clock, iconBg: "bg-indigo-950/60 text-indigo-400" },
                  { label: "Laporan Tuntas", value: stats.selesai, icon: CheckCircle2, iconBg: "bg-emerald-950/60 text-emerald-400" },
                  { label: "Pelapor Anonim", value: stats.anonim, icon: Lock, iconBg: "bg-purple-950/60 text-purple-400" },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div 
                      key={idx} 
                      className="bg-[#181920] border border-[#23242F] rounded-2xl p-4 flex items-center gap-3.5 transition-transform hover:-translate-y-0.5"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-[#8B8D97] block truncate">
                          {stat.label}
                        </span>
                        <span className="text-xl font-bold font-heading text-white">
                          {stat.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dual Visualizations Row: Spline Line Chart & Project Completion */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Card: Spline Line Chart */}
                <div className="lg:col-span-2 bg-[#181920] border border-[#23242F] rounded-2xl p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222430] text-xs font-semibold text-slate-200 border border-[#2C2E3C]"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#FF6B4A]" />
                        <span>Tahun 2026 (YTD)</span>
                      </button>
                    </div>
                    <div className="text-xs text-[#8B8D97]">
                      <BarChart2 className="w-4 h-4 text-[#8B8D97]" />
                    </div>
                  </div>

                  <div className="space-y-1 mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold font-heading text-white">{stats.total} Laporan</span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                        ▲ +12.4%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#8B8D97] pt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-medium">
                        ● Penyelesaian On Track
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF6B4A]"></span>
                        Laporan Masuk
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        Selesai Ditindak
                      </span>
                    </div>
                  </div>

                  {/* SVG Spline Line Graphic */}
                  <div className="relative w-full h-44">
                    <svg viewBox="0 0 600 150" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="coralGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF6B4A" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#FF6B4A" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      <path
                        d="M 15 110 Q 75 105 130 95 T 250 80 T 360 40 T 470 60 T 585 70"
                        fill="none"
                        stroke="#FF6B4A"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      <path
                        d="M 15 130 Q 75 125 130 115 T 250 100 T 360 85 T 470 95 T 585 90"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        opacity="0.8"
                      />

                      {/* Tooltip Point Marker */}
                      <circle cx="360" cy="40" r="5" fill="#FF6B4A" stroke="#FFFFFF" strokeWidth="2.5" />
                      <g transform="translate(345, 10)">
                        <rect width="50" height="20" rx="5" fill="#FF6B4A" />
                        <text x="25" y="14" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
                          {stats.total} Kasus
                        </text>
                      </g>
                    </svg>

                    {/* Month Labels */}
                    <div className="flex justify-between text-[11px] font-semibold text-[#8B8D97] pt-3">
                      <span>JAN</span>
                      <span>FEB</span>
                      <span>MAR</span>
                      <span>APR</span>
                      <span>MAY</span>
                      <span>JUN</span>
                      <span>JUL</span>
                      <span>AUG</span>
                      <span>SEP</span>
                      <span>OCT</span>
                      <span>NOV</span>
                      <span>DEC</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Project Completion per Kategori */}
                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Project Completion (Per Kategori)
                    </h3>
                    <p className="text-xs text-[#8B8D97] mt-1 mb-6">
                      Rasio penanganan perkara pengawasan terintegrasi
                    </p>

                    <div className="space-y-4">
                      {[
                        { name: "Korupsi Keuangan", pct: 85 },
                        { name: "Pungutan Liar (Pungli)", pct: 62 },
                        { name: "Gratifikasi & Suap", pct: 78 },
                        { name: "Disiplin ASN", pct: 45 },
                        { name: "Pelayanan Publik", pct: 92 },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-300">{item.name}</span>
                            <span className="font-bold text-[#FF6B4A]">{item.pct}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#222430] overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-[#FF6B4A] transition-all duration-700"
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] text-[#8B8D97] pt-6 border-t border-[#23242F]">
                    <span>0%</span>
                    <span>20%</span>
                    <span>40%</span>
                    <span>60%</span>
                    <span>80%</span>
                    <span>100%</span>
                  </div>
                </div>

              </div>

              {/* Quad Widget Grid: Team Members, Tasks SOP, Outreach Bar, Server Storage Donut */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Team members */}
                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Team members</h4>
                      <button 
                        type="button" 
                        onClick={() => setActiveNav('Profile')} 
                        className="text-[#8B8D97] hover:text-white"
                      >
                        <User className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {[
                        { name: "Ir. H. Hendri", role: "Inspektur Pembantu Wilayah I", init: "HH" },
                        { name: "Rina Marlina, S.STP", role: "Verifikator Utama Laporan", init: "RM" },
                        { name: "Budi Raharjo, S.H.", role: "Auditor Investigasi Khusus", init: "BR" },
                      ].map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#222430] border border-[#2C2E3C] flex items-center justify-center font-bold text-xs text-white shrink-0">
                              {member.init}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{member.name}</p>
                              <p className="text-[10px] text-[#8B8D97] truncate">{member.role}</p>
                            </div>
                          </div>
                          <MoreVertical className="w-3.5 h-3.5 text-[#8B8D97] shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Tasks SOP Checklist */}
                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tasks SOP Verifikasi</h4>
                      <button type="button" onClick={() => setActiveNav('Help')} className="text-[#8B8D97] hover:text-white">
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {tasks.map((task) => (
                        <div 
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#222430] transition-colors cursor-pointer group"
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                            task.completed ? 'bg-[#FF6B4A] text-white' : 'border border-[#3A3D4D] group-hover:border-[#FF6B4A]'
                          }`}>
                            {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-xs truncate ${
                            task.completed ? 'text-slate-300' : 'text-[#8B8D97]'
                          }`}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Outreach Success Bar Chart */}
                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Outreach Success</h4>
                      <span className="text-[11px] font-bold text-emerald-400">▲ +20%</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-xl font-extrabold text-white">{stats.total}</span>
                      <span className="text-xs text-[#8B8D97] ml-2">Responses This Week</span>
                    </div>

                    {/* Vertical Rounded Bars */}
                    <div className="flex items-end justify-between h-24 pt-2">
                      {[
                        { day: "01", h: "40%" },
                        { day: "07", h: "25%" },
                        { day: "14", h: "70%" },
                        { day: "21", h: "50%" },
                        { day: "28", h: "35%" },
                        { day: "04", h: "85%" },
                        { day: "11", h: "60%" },
                      ].map((bar, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                          <div className="w-3.5 rounded-full bg-[#222430] h-20 flex items-end overflow-hidden">
                            <div 
                              className="w-full bg-[#FF6B4A] rounded-full transition-all duration-500" 
                              style={{ height: bar.h }} 
                            />
                          </div>
                          <span className="text-[9px] font-semibold text-[#8B8D97]">{bar.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Server Storage Donut Chart */}
                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Server Storage</h4>
                      <span className="text-[10px] text-[#8B8D97]">Monthly ▾</span>
                    </div>

                    {/* Donut Graphic */}
                    <div className="flex items-center justify-center my-3">
                      <div className="relative w-24 h-24">
                        <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#222430"
                            strokeWidth="3.8"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#FF6B4A"
                            strokeWidth="4"
                            strokeDasharray="63, 100"
                            strokeLinecap="round"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="3.8"
                            strokeDasharray="25, 100"
                            strokeDashoffset="-65"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="flex justify-around text-center pt-2 border-t border-[#23242F]">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#8B8D97]">
                          <span className="w-2 h-2 rounded-full bg-[#FF6B4A]"></span>
                          Berkas Bukti
                        </div>
                        <span className="text-xs font-bold text-white">63%</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#8B8D97]">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          Enkripsi Data
                        </div>
                        <span className="text-xs font-bold text-white">25%</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Weekly Reports Table (Pengaduan Terkini) */}
              <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Weekly Reports (Pengaduan Terkini)
                    </h3>
                    <p className="text-xs text-[#8B8D97] mt-0.5">
                      Kelola dan periksa seluruh dokumen laporan pengaduan masuk
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status Filter Pills */}
                    <div className="flex items-center bg-[#12131A] p-1 rounded-xl border border-[#222430]">
                      {['all', 'Diajukan', 'Diproses', 'Selesai'].map((statusKey) => (
                        <button
                          key={statusKey}
                          type="button"
                          onClick={() => setFilterStatus(statusKey)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            filterStatus === statusKey
                              ? 'bg-[#FF6B4A] text-white shadow-sm'
                              : 'text-[#8B8D97] hover:text-white'
                          }`}
                        >
                          {statusKey === 'all' ? 'All' : statusKey}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8D97]" />
                      <input
                        type="text"
                        placeholder="Search token / title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl bg-[#12131A] border border-[#222430] text-xs text-white placeholder-[#8B8D97] focus:outline-none focus:border-[#FF6B4A]"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[#8B8D97] border-b border-[#23242F]">
                        <th className="py-3 px-4 font-semibold">Name / Title</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Size</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold">Time</th>
                        <th className="py-3 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#23242F]">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#8B8D97]">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#FF6B4A]" />
                            Memuat data pengaduan...
                          </td>
                        </tr>
                      ) : filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#8B8D97]">
                            Tidak ada data pengaduan yang sesuai dengan kriteria.
                          </td>
                        </tr>
                      ) : (
                        filteredReports.slice(0, 6).map((report) => (
                          <tr key={report.id || report.token} className="hover:bg-[#1C1E27] transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-white block truncate max-w-xs">{report.title}</span>
                              <span className="text-[10px] text-[#8B8D97] font-mono">
                                {report.token} • {report.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                report.status === 'Selesai' 
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                                  : report.status === 'Diproses' || report.status === 'Ditindaklanjuti'
                                  ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                              }`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 font-mono">
                              {report.file_size ? `${(report.file_size / (1024 * 1024)).toFixed(0)} MB` : '12 MB'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">
                              {report.date || report.date_submitted ? (report.date || report.date_submitted).split(',')[0] : '12 Juni 2026'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">
                              {report.date || report.date_submitted ? (report.date || report.date_submitted).split(',')[1] || '08:30 WIB' : '08:30 WIB'}
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => setSelectedReport(report)}
                                className="px-3 py-1.5 rounded-lg bg-[#222430] hover:bg-[#2A2C3A] text-slate-200 font-semibold transition-colors"
                              >
                                Detail
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusModalReport(report);
                                  setNewStatus(report.status);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#FF6B4A] hover:bg-[#ff7b5c] text-white font-semibold transition-colors shadow-sm"
                              >
                                Ubah Status
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredReports.length > 6 && (
                  <div className="pt-2 text-center border-t border-[#23242F]">
                    <button
                      type="button"
                      onClick={() => setActiveNav('Databases')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B4A] hover:underline"
                    >
                      <span>Lihat Seluruh {stats.total} Berkas di Databases</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===================================================================
              VIEW 2: ANALYTICS (Statistik & Analisis Kinerja WBS)
              =================================================================== */}
          {activeNav === 'Analytics' && (
            <div className="space-y-6">
              
              {/* Analytics Header KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-5">
                  <span className="text-xs text-[#8B8D97] block">Tingkat Penyelesaian</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-white">
                      {stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 100}%
                    </span>
                    <span className="text-xs font-bold text-emerald-400">▲ Optimal</span>
                  </div>
                  <p className="text-[11px] text-[#8B8D97] mt-2">Rasio laporan tuntas terhadap seluruh berkas</p>
                </div>

                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-5">
                  <span className="text-xs text-[#8B8D97] block">Rata-rata Waktu Verifikasi</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-white">&lt; 24 Jam</span>
                    <span className="text-xs font-bold text-emerald-400">Target SLA</span>
                  </div>
                  <p className="text-[11px] text-[#8B8D97] mt-2">SOP respons awal telaah APIP Kota Padang</p>
                </div>

                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-5">
                  <span className="text-xs text-[#8B8D97] block">Pelapor Terlindungi (Anonim)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-white">{stats.anonim}</span>
                    <span className="text-xs font-semibold text-purple-400">
                      {stats.total > 0 ? Math.round((stats.anonim / stats.total) * 100) : 0}% Total
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8B8D97] mt-2">Kerahasiaan data dijamin UU Tipikor & WBS</p>
                </div>

                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-5">
                  <span className="text-xs text-[#8B8D97] block">Pelapor Terverifikasi (Identitas)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-white">{stats.bernama}</span>
                    <span className="text-xs font-semibold text-blue-400">
                      {stats.total > 0 ? Math.round((stats.bernama / stats.total) * 100) : 0}% Total
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8B8D97] mt-2">Identitas terenkripsi penuh AES-256 GCM</p>
                </div>
              </div>

              {/* Breakdown Kategori & Sebaran Pelanggaran */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Sebaran Kategori Dugaan Pelanggaran */}
                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Sebaran Kategori Dugaan Pelanggaran
                    </h3>
                    <p className="text-xs text-[#8B8D97] mt-1">
                      Distribusi klasifikasi kasus yang dilaporkan masyarakat
                    </p>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(stats.categoriesMap).length === 0 ? (
                      <p className="text-xs text-[#8B8D97]">Belum ada data kategori.</p>
                    ) : (
                      Object.entries(stats.categoriesMap).map(([category, count]) => {
                        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                        return (
                          <div key={category} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-slate-200">{category}</span>
                              <span className="font-bold text-[#FF6B4A] font-mono">{count} Kasus ({pct}%)</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-[#222430] overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-[#FF6B4A] transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Status Penanganan & SLA Investigasi */}
                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Status Penanganan & Efektivitas APIP
                    </h3>
                    <p className="text-xs text-[#8B8D97] mt-1">
                      Tahapan progres seluruh pengaduan yang terdaftar
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Diajukan (Menunggu Telaah Awal)", count: stats.diajukan, color: "bg-amber-500", text: "text-amber-400" },
                      { label: "Diproses (Pemeriksaan / Audit)", count: stats.diproses, color: "bg-blue-500", text: "text-blue-400" },
                      { label: "Ditindaklanjuti (Investigasi Khusus)", count: stats.ditindaklanjuti, color: "bg-indigo-500", text: "text-indigo-400" },
                      { label: "Selesai (LHP Diterbitkan & Selesai)", count: stats.selesai, color: "bg-emerald-500", text: "text-emerald-400" },
                    ].map((st, idx) => {
                      const pct = stats.total > 0 ? Math.round((st.count / stats.total) * 100) : 0;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-200">{st.label}</span>
                            <span className={`font-bold font-mono ${st.text}`}>{st.count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-[#222430] overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${st.color} transition-all duration-700`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ===================================================================
              VIEW 3: DATABASES (Pangkalan Data Seluruh Pengaduan WBS)
              =================================================================== */}
          {activeNav === 'Databases' && (
            <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-6 space-y-6">
              
              {/* Header Filters & Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-heading">
                    Pangkalan Data Pengaduan Masuk
                  </h3>
                  <p className="text-xs text-[#8B8D97] mt-0.5">
                    Menampilkan {filteredReports.length} dari total {reports.length} berkas laporan
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Selector */}
                  <div className="flex items-center bg-[#12131A] p-1 rounded-xl border border-[#222430]">
                    {[
                      { key: 'all', label: 'Semua Status' },
                      { key: 'Diajukan', label: 'Diajukan' },
                      { key: 'Diproses', label: 'Diproses' },
                      { key: 'Ditindaklanjuti', label: 'Ditindaklanjuti' },
                      { key: 'Selesai', label: 'Selesai' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilterStatus(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          filterStatus === tab.key
                            ? 'bg-[#FF6B4A] text-white shadow-sm'
                            : 'text-[#8B8D97] hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8D97]" />
                    <input
                      type="text"
                      placeholder="Cari token, judul, instansi, lokasi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12131A] border border-[#222430] text-xs text-white placeholder-[#8B8D97] focus:outline-none focus:border-[#FF6B4A]"
                    />
                  </div>
                </div>
              </div>

              {/* Complete Database Table */}
              <div className="overflow-x-auto rounded-xl border border-[#23242F]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#12131A] text-[#8B8D97] border-b border-[#23242F]">
                      <th className="py-3 px-4 font-semibold">Token & Tanggal</th>
                      <th className="py-3 px-4 font-semibold">Judul & Kategori</th>
                      <th className="py-3 px-4 font-semibold">Instansi / Lokasi</th>
                      <th className="py-3 px-4 font-semibold">Pelapor</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#23242F]">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#8B8D97]">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FF6B4A]" />
                          Menghubungi Supabase PostgreSQL...
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#8B8D97]">
                          Tidak ada berkas pengaduan yang cocok dengan filter atau pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr key={report.id || report.token} className="hover:bg-[#1C1E27] transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-[#FF6B4A] block">{report.token}</span>
                            <span className="text-[10px] text-[#8B8D97]">
                              {report.date || report.date_submitted || '-'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <span className="font-bold text-white block truncate">{report.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {report.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {report.location || '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              report.is_anonim 
                                ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40' 
                                : 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                            }`}>
                              {report.is_anonim ? 'Anonim' : 'Identitas Ada'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              report.status === 'Selesai' 
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                                : report.status === 'Diproses' || report.status === 'Ditindaklanjuti'
                                ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                                : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => setSelectedReport(report)}
                              className="px-3 py-1.5 rounded-lg bg-[#222430] hover:bg-[#2A2C3A] text-slate-200 font-semibold transition-colors"
                            >
                              Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStatusModalReport(report);
                                setNewStatus(report.status);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#FF6B4A] hover:bg-[#ff7b5c] text-white font-semibold transition-colors shadow-sm"
                            >
                              Ubah Status
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ===================================================================
              VIEW 4: HELP (Panduan Verifikator & SOP APIP)
              =================================================================== */}
          {activeNav === 'Help' && (
            <div className="space-y-6">
              
              <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#222430] flex items-center justify-center text-[#FF6B4A]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Standar Operasional Prosedur (SOP) APIP Inspektorat
                    </h3>
                    <p className="text-xs text-[#8B8D97]">
                      Pedoman penelaahan dan investigasi pengaduan masyarakat Kota Padang
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-[#12131A] p-4 rounded-xl border border-[#222430] space-y-2">
                    <span className="inline-block px-2 py-0.5 rounded bg-[#FF6B4A]/10 text-[#FF6B4A] text-[10px] font-bold">
                      TAHAP 1: TELAAH AWAL
                    </span>
                    <h4 className="text-xs font-bold text-white">Verifikasi 5W + 1H</h4>
                    <p className="text-[11px] text-[#8B8D97] leading-relaxed">
                      Memeriksa kejelasan laporan: Apa yang terjadi, Siapa pelaku/pihak terlibat, Kapan waktu kejadian, Di mana lokasi/OPD, Mengapa bisa terjadi, dan Bagaimana modusnya.
                    </p>
                  </div>

                  <div className="bg-[#12131A] p-4 rounded-xl border border-[#222430] space-y-2">
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                      TAHAP 2: VALIDASI BUKTI
                    </span>
                    <h4 className="text-xs font-bold text-white">Uji Keabsahan Bukti</h4>
                    <p className="text-[11px] text-[#8B8D97] leading-relaxed">
                      Melakukan verifikasi forensik atas berkas bukti awal (foto, rekaman, slip transfer, dokumen kontrak). Hubungi pelapor jika memerlukan bukti tambahan melalui tiket lacak.
                    </p>
                  </div>

                  <div className="bg-[#12131A] p-4 rounded-xl border border-[#222430] space-y-2">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                      TAHAP 3: AUDIT & LHP
                    </span>
                    <h4 className="text-xs font-bold text-white">Penerbitan Rekomendasi</h4>
                    <p className="text-[11px] text-[#8B8D97] leading-relaxed">
                      Menyusun Laporan Hasil Pemeriksaan (LHP) untuk diajukan kepada Walikota / Pimpinan Instansi guna penjatuhan sanksi atau pelimpahan ke APH jika ada indikasi pidana korupsi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Regulasi & Kerahasiaan Pelapor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#FF6B4A]" />
                    <span>Jaminan Perlindungan Hukum Pelapor</span>
                  </div>
                  <p className="text-xs text-[#8B8D97] leading-relaxed">
                    Sesuai Peraturan Walikota Padang dan UU Perlindungan Saksi dan Korban (LPSK), verifikator wajib menjaga kerahasiaan identitas pelapor. Data pelapor yang memilih opsi anonim tidak dapat diakses atau diungkapkan kepada pihak manapun.
                  </p>
                </div>

                <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>Bantuan Teknis & Kontak APIP</span>
                  </div>
                  <p className="text-xs text-[#8B8D97] leading-relaxed">
                    Jika Anda mengalami kendala teknis dalam dekripsi dokumen atau butuh koordinasi darurat dengan Tim Saber Pungli Kota Padang, hubungi sekretariat Inspektorat di <span className="text-white font-mono">inspektorat@padang.go.id</span> atau ekstensi internal 104.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ===================================================================
              VIEW 5: SETTINGS (Pengaturan Keamanan & Sandi)
              =================================================================== */}
          {activeNav === 'Settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Ganti Password */}
              <div className="lg:col-span-2 bg-[#181920] border border-[#23242F] rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Ganti Kata Sandi Verifikator
                  </h3>
                  <p className="text-xs text-[#8B8D97] mt-0.5">
                    Perbarui kata sandi akun Anda secara berkala demi menjaga keamanan data WBS
                  </p>
                </div>

                {passwordMsg.text && (
                  <div className={`p-3.5 rounded-xl text-xs font-medium border ${
                    passwordMsg.type === 'success' 
                      ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300' 
                      : 'bg-red-950/60 border-red-800/60 text-red-300'
                  }`}>
                    {passwordMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12131A] border border-[#222430] text-xs text-white placeholder-[#8B8D97] focus:outline-none focus:border-[#FF6B4A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12131A] border border-[#222430] text-xs text-white placeholder-[#8B8D97] focus:outline-none focus:border-[#FF6B4A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12131A] border border-[#222430] text-xs text-white placeholder-[#8B8D97] focus:outline-none focus:border-[#FF6B4A]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FF6B4A] hover:bg-[#ff7b5c] text-white transition-all shadow-md shadow-[#FF6B4A]/20 disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{changingPassword ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}</span>
                  </button>
                </form>
              </div>

              {/* Status Proteksi Sistem */}
              <div className="bg-[#181920] border border-[#23242F] rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Status Proteksi Sistem
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#12131A] border border-[#222430]">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span className="text-slate-300 font-medium">Enkripsi Pelapor</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">AES-256</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#12131A] border border-[#222430]">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300 font-medium">Supabase Cloud</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">ONLINE</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#12131A] border border-[#222430]">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#FF6B4A]" />
                      <span className="text-slate-300 font-medium">Session Guard</span>
                    </div>
                    <span className="font-mono text-slate-300 font-bold">File Secure</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#222430]/40 border border-[#2A2C3A] text-[11px] text-[#8B8D97] leading-relaxed">
                  Semua transaksi audit dan pembaruan status tercatat dalam riwayat linimasa yang tidak dapat dihapus (*tamper-proof audit trail*).
                </div>
              </div>

            </div>
          )}

          {/* ===================================================================
              VIEW 6: PROFILE (Profil Petugas Auditor APIP)
              =================================================================== */}
          {activeNav === 'Profile' && (
            <div className="max-w-2xl bg-[#181920] border border-[#23242F] rounded-2xl p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6B4A] to-[#FF8E72] flex items-center justify-center font-extrabold text-2xl text-white shadow-lg shadow-[#FF6B4A]/25">
                  {adminUser?.username ? adminUser.username.slice(0, 2).toUpperCase() : 'AD'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-heading">
                    {adminUser?.name || adminUser?.username || 'Administrator APIP'}
                  </h3>
                  <p className="text-xs text-[#FF6B4A] font-semibold mt-0.5">
                    Petugas Verifikator Whistleblowing System
                  </p>
                  <p className="text-xs text-[#8B8D97] mt-1">
                    Inspektorat Daerah Pemerintah Kota Padang
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#23242F] text-xs">
                <div className="p-3.5 rounded-xl bg-[#12131A] border border-[#222430]">
                  <span className="text-[#8B8D97] block text-[10px] uppercase font-bold">Email Petugas</span>
                  <span className="font-semibold text-white mt-1 block">
                    {adminUser?.email || 'admin@inspektorat.padang.go.id'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#12131A] border border-[#222430]">
                  <span className="text-[#8B8D97] block text-[10px] uppercase font-bold">Tingkat Hak Akses</span>
                  <span className="font-semibold text-emerald-400 mt-1 block">
                    Full Inspector Privilege (Read & Write)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#12131A] border border-[#222430]">
                  <span className="text-[#8B8D97] block text-[10px] uppercase font-bold">Status Autentikasi</span>
                  <span className="font-semibold text-white mt-1 block">
                    Terverifikasi (Session Active)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#12131A] border border-[#222430]">
                  <span className="text-[#8B8D97] block text-[10px] uppercase font-bold">Waktu Sesi Dimulai</span>
                  <span className="font-semibold text-white mt-1 block">
                    {currentDateFormatted}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#222430] hover:bg-[#2A2C3A] text-white transition-colors"
                >
                  Ubah Kata Sandi
                </button>

                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors"
                >
                  Keluar dari Akun
                </button>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* =========================================================================
          MODAL 1: DETAIL PENGADUAN & DEKRIPSI IDENTITAS
          ========================================================================= */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-admin-slide-up">
          <div className="w-full max-w-2xl bg-[#181920] border border-[#2A2C3A] rounded-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#23242F] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B4A]">
                  REPORT TOKEN
                </span>
                <h3 className="text-xl font-bold font-mono text-white mt-0.5">
                  {selectedReport.token}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg bg-[#222430] text-[#8B8D97] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-[#12131A] p-4 rounded-xl border border-[#222430]">
              <div>
                <span className="text-[#8B8D97] block">Tanggal Masuk:</span>
                <span className="font-semibold text-white">
                  {selectedReport.date || selectedReport.date_submitted || '-'}
                </span>
              </div>
              <div>
                <span className="text-[#8B8D97] block">Status Terakhir:</span>
                <span className="font-semibold text-[#FF6B4A]">
                  {selectedReport.status}
                </span>
              </div>
              <div>
                <span className="text-[#8B8D97] block">Kategori:</span>
                <span className="font-semibold text-white">
                  {selectedReport.category}
                </span>
              </div>
              <div>
                <span className="text-[#8B8D97] block">Lokasi:</span>
                <span className="font-semibold text-white">
                  {selectedReport.location || '-'}
                </span>
              </div>
            </div>

            {/* Identitas Pelapor (Decrypted / Anonim) */}
            <div className="bg-[#12131A] p-4 rounded-xl border border-[#222430] space-y-2 text-xs">
              <span className="text-[#8B8D97] block font-semibold text-[10px] uppercase">
                Identitas Pelapor (AES-256 Terlindungi):
              </span>
              {selectedReport.is_anonim ? (
                <div className="flex items-center gap-2 text-purple-400 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Pelapor memilih untuk menyamarkan identitas (Anonim).</span>
                </div>
              ) : (
                <div className="space-y-1 text-slate-200">
                  <p><strong>Nama:</strong> {selectedReport.reporter_name || '-'}</p>
                  <p><strong>No. Telepon / WA:</strong> {selectedReport.reporter_phone || '-'}</p>
                  <p><strong>Email:</strong> {selectedReport.reporter_email || '-'}</p>
                </div>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                Judul Dugaan Pelanggaran:
              </span>
              <p className="text-xs bg-[#12131A] p-3 rounded-xl border border-[#222430] text-slate-200 font-medium">
                {selectedReport.title}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                Kronologi / Uraian Rinci:
              </span>
              <p className="text-xs bg-[#12131A] p-3.5 rounded-xl border border-[#222430] text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedReport.description}
              </p>
            </div>

            {/* Download Evidence Attachment if available */}
            {selectedReport.evidence_path && (
              <div className="pt-2">
                <a
                  href={`http://127.0.0.1:8000/storage/${selectedReport.evidence_path}`}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#222430] hover:bg-[#2A2C3A] text-slate-200 border border-[#2C2E3C] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#FF6B4A]" />
                  <span>Download {selectedReport.evidence_path.split('/').pop()}</span>
                </a>
              </div>
            )}

            {/* Riwayat Linimasa Audit */}
            {selectedReport.histories && selectedReport.histories.length > 0 && (
              <div className="pt-3 border-t border-[#23242F] space-y-3">
                <span className="text-xs font-bold text-white block">
                  Riwayat Tindak Lanjut:
                </span>
                <div className="space-y-2">
                  {selectedReport.histories.map((hist, hIdx) => (
                    <div key={hIdx} className="p-3 rounded-xl bg-[#12131A] border border-[#222430] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#8B8D97]">
                        <span className="font-semibold text-white">{hist.status}</span>
                        <span>{hist.date || hist.created_at || '-'}</span>
                      </div>
                      <p className="text-slate-300">{hist.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#23242F] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#222430] text-slate-300 hover:text-white transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const rep = selectedReport;
                  setSelectedReport(null);
                  setStatusModalReport(rep);
                  setNewStatus(rep.status);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6B4A] hover:bg-[#ff7b5c] text-white transition-colors shadow-md shadow-[#FF6B4A]/20"
              >
                Ubah Status Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: UBAH STATUS LAPORAN & CATATAN INVESTIGASI
          ========================================================================= */}
      {statusModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-admin-slide-up">
          <div className="w-full max-w-lg bg-[#181920] border border-[#2A2C3A] rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#23242F] pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#FF6B4A] uppercase">
                  TINDAK LANJUT LAPORAN
                </span>
                <h3 className="text-lg font-bold font-mono text-white">
                  {statusModalReport.token}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalReport(null)}
                className="p-1.5 rounded-lg bg-[#222430] text-[#8B8D97] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statusErrorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs">
                {statusErrorMsg}
              </div>
            )}

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Pilih Status Baru:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12131A] border border-[#222430] text-white focus:outline-none focus:border-[#FF6B4A]"
                >
                  <option value="Diajukan">Diajukan (Belum Ditelaah)</option>
                  <option value="Diproses">Diproses (Sedang Diteliti / Pemeriksaan Awal)</option>
                  <option value="Ditindaklanjuti">Ditindaklanjuti (Investigasi Khusus / Klarifikasi)</option>
                  <option value="Selesai">Selesai (Laporan Selesai & LHP Diterbitkan)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Catatan Resmi Tim Penelaah / APIP: *
                </label>
                <textarea
                  required
                  rows={4}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Contoh: Telah dilakukan verifikasi awal dokumen. Laporan dilanjutkan ke tahap audit investigasi lapangan oleh Tim Irban Wilayah I."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12131A] border border-[#222430] text-white placeholder-[#8B8D97] focus:outline-none focus:border-[#FF6B4A] leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Lampiran Dokumen Resmi APIP (Opsional):
                </label>
                <input
                  type="file"
                  onChange={handleStatusFileChange}
                  className="w-full text-[11px] text-[#8B8D97] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#222430] file:text-slate-200 hover:file:bg-[#2A2C3A]"
                />
                <span className="text-[10px] text-[#8B8D97] mt-1 block">
                  Maksimal berkas 10MB (PDF, DOCX, JPG, PNG).
                </span>
              </div>

              <div className="pt-3 border-t border-[#23242F] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStatusModalReport(null);
                    setStatusErrorMsg('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#222430] text-slate-300 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6B4A] hover:bg-[#ff7b5c] text-white transition-all shadow-md shadow-[#FF6B4A]/20 disabled:opacity-50"
                >
                  {updatingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{updatingStatus ? 'Menyimpan...' : 'Perbarui Status'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: KONFIRMASI LOG OUT SESI ADMIN
          ========================================================================= */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-admin-slide-up">
          <div className="w-full max-w-md bg-[#181920] border border-[#2A2C3A] rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Konfirmasi Keluar Sesi Admin
                </h3>
                <p className="text-xs text-[#8B8D97]">
                  WBS Inspektorat Pemerintah Kota Padang
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#12131A] p-3.5 rounded-xl border border-[#222430]">
              Apakah Anda yakin ingin mengakhiri sesi administrasi pengawasan? Anda harus memasukkan kredensial kembali untuk mengakses pangkalan data pengaduan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#222430] hover:bg-[#2A2C3A] text-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Keluar Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: GANTI KATA SANDI CEPAT
          ========================================================================= */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-admin-slide-up">
          <div className="w-full max-w-md bg-[#181920] border border-[#2A2C3A] rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#23242F] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#222430] flex items-center justify-center text-[#FF6B4A]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Ganti Kata Sandi
                  </h3>
                  <p className="text-[11px] text-[#8B8D97]">
                    Perbarui kata sandi akun admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordModalOpen(false);
                  setPasswordMsg({ type: '', text: '' });
                }}
                className="p-1.5 rounded-lg bg-[#222430] text-[#8B8D97] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordMsg.text && (
              <div className={`p-3 rounded-xl text-xs font-medium border ${
                passwordMsg.type === 'success' 
                  ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300' 
                  : 'bg-red-950/60 border-red-800/60 text-red-300'
              }`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Kata Sandi Lama:
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12131A] border border-[#222430] text-white focus:outline-none focus:border-[#FF6B4A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Kata Sandi Baru:
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12131A] border border-[#222430] text-white focus:outline-none focus:border-[#FF6B4A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Konfirmasi Kata Sandi Baru:
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12131A] border border-[#222430] text-white focus:outline-none focus:border-[#FF6B4A]"
                />
              </div>

              <div className="pt-3 border-t border-[#23242F] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPasswordMsg({ type: '', text: '' });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#222430] text-slate-300 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF6B4A] hover:bg-[#ff7b5c] text-white transition-all shadow-md shadow-[#FF6B4A]/20 disabled:opacity-50"
                >
                  {changingPassword && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{changingPassword ? 'Menyimpan...' : 'Perbarui Sandi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
