import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  AlertCircle, 
  ShieldCheck, 
  BarChart3, 
  KeyRound, 
  LogOut, 
  Building2, 
  CheckCircle2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function AdminSidebar({ 
  activeMenu, 
  setActiveMenu, 
  stats, 
  adminUser, 
  onOpenPasswordModal, 
  onLogout 
}) {
  const navItems = [
    {
      group: "Pusat Kendali",
      items: [
        {
          id: "overview",
          label: "Ringkasan Eksekutif",
          icon: LayoutDashboard,
          badge: null,
          desc: "Statistik & antrean penting"
        },
        {
          id: "reports",
          label: "Daftar Pengaduan",
          icon: FileText,
          badge: stats.total,
          badgeVariant: "neutral",
          desc: "Seluruh berkas masuk"
        },
        {
          id: "verification",
          label: "Verifikasi Mendesak",
          icon: AlertCircle,
          badge: stats.diajukan > 0 ? stats.diajukan : null,
          badgeVariant: "urgent",
          desc: "Laporan butuh telaah awal"
        },
        {
          id: "analytics",
          label: "Statistik & Analisis",
          icon: BarChart3,
          badge: null,
          desc: "Sebaran OPD & kategori"
        }
      ]
    },
    {
      group: "Sistem & Keamanan",
      items: [
        {
          id: "security",
          label: "Keamanan Sandi",
          icon: KeyRound,
          action: onOpenPasswordModal,
          desc: "Kredensial akun verifikator"
        }
      ]
    }
  ];

  return (
    <aside className="w-72 shrink-0 bg-[#0B192C] text-slate-200 border-r border-slate-800 flex flex-col justify-between min-h-[calc(100vh-5rem)]">
      
      {/* Top Brand Header */}
      <div className="p-5 border-b border-slate-800/80 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
            <img 
              src="/logo_padang.svg" 
              alt="Logo Padang" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-sm text-white tracking-tight leading-tight truncate">
              WBS INSPEKTORAT
            </h2>
            <p className="text-[11px] font-medium text-amber-400 truncate">
              Pemerintah Kota Padang
            </p>
          </div>
        </div>

        {/* Live System Badge */}
        <div className="px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Supabase Cloud</span>
          </div>
          <span className="text-emerald-400 font-mono font-semibold">ONLINE</span>
        </div>
      </div>

      {/* Navigation Menus */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {navItems.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1">
              {group.group}
            </span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      setActiveMenu(item.id);
                    }
                  }}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-slate-950" : "text-slate-400 group-hover:text-amber-400"
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                      isActive
                        ? "bg-slate-950 text-amber-400"
                        : item.badgeVariant === "urgent"
                          ? "bg-rose-900/80 text-rose-300 border border-rose-700/60 animate-pulse"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 font-mono">
            {(adminUser?.username || 'A').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {adminUser?.username || 'Petugas Verifikator'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              Auditor APIP Kota Padang
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sesi</span>
        </button>
      </div>

    </aside>
  );
}
