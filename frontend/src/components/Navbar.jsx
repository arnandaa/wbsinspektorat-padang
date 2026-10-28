import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, FileText, Search, UserCheck, Menu, X, LogIn, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 shadow-xs group-hover:border-blue-300 transition-colors">
              <img 
                src="/logo_padang.svg" 
                alt="Logo Kota Padang" 
                className="w-9 h-9 object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-lg text-blue-950 tracking-tight leading-snug group-hover:text-blue-700 transition-colors">
                WBS INSPEKTORAT
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pemerintah Kota Padang
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/') 
                  ? 'bg-blue-50 text-blue-900 border border-blue-200/60 shadow-xs' 
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-800" />
              Beranda
            </Link>

            <Link
              to="/lapor"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/lapor')
                  ? 'bg-blue-50 text-blue-900 border border-blue-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-800" />
              Buat Pengaduan
            </Link>

            <Link
              to="/lacak"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/lacak')
                  ? 'bg-blue-50 text-blue-900 border border-blue-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4 text-blue-800" />
              Lacak Pengaduan
            </Link>

            {/* Admin CTA Link */}
            {isAuthenticated ? (
              <Link
                to="/admin/dashboard"
                className={`ml-2 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive('/admin/dashboard')
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-blue-950 text-white hover:bg-blue-900 shadow-xs'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                Dashboard Admin
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="ml-2 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-900 border border-slate-300 hover:border-blue-300 hover:bg-slate-50 transition-all shadow-xs"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                Login Petugas
              </Link>
            )}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-700 hover:text-blue-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold ${
                isActive('/') ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-5 h-5 text-blue-800" />
              Beranda
            </Link>

            <Link
              to="/lapor"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold ${
                isActive('/lapor') ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-5 h-5 text-blue-800" />
              Buat Pengaduan
            </Link>

            <Link
              to="/lacak"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold ${
                isActive('/lacak') ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Search className="w-5 h-5 text-blue-800" />
              Lacak Pengaduan
            </Link>

            <div className="pt-2 border-t border-slate-100">
              {isAuthenticated ? (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-base font-bold text-white bg-blue-950 shadow-sm"
                >
                  <LayoutDashboard className="w-5 h-5 text-amber-400" />
                  Dashboard Admin
                </Link>
              ) : (
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-base font-semibold text-slate-800 border border-slate-300 hover:bg-slate-100"
                >
                  <LogIn className="w-5 h-5 text-slate-500" />
                  Login Petugas
                </Link>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
