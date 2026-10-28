import React from 'react';
import { ShieldCheck, MapPin, Phone, Mail, ExternalLink, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Kolom 1: Profil Institusi */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-950 flex items-center justify-center border border-blue-800">
                <img src="/logo_padang.svg" alt="Kota Padang" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-white">
                  INSPEKTORAT DAERAH KOTA PADANG
                </h3>
                <p className="text-xs text-slate-400">Pemerintah Kota Padang, Sumatera Barat</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pr-6">
              Whistleblowing System (WBS) merupakan sarana resmi pelaporan dugaan tindak pidana korupsi, pungutan liar, gratifikasi, serta pelanggaran kode etik ASN dengan komitmen kerahasiaan dan perlindungan penuh bagi pelapor.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/80 rounded-md py-1.5 px-3 w-fit">
              <Lock className="w-3.5 h-3.5" />
              Dilindungi Enkripsi Kriptografis AES-256 & Anonimitas Mutlak
            </div>
          </div>

          {/* Kolom 2: Tautan Pintas */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-white text-sm tracking-wider uppercase">
              Kanal Layanan
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/lapor" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  &bull; Buat Pengaduan Baru
                </a>
              </li>
              <li>
                <a href="/lacak" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  &bull; Lacak Status Pengaduan
                </a>
              </li>
              <li>
                <a href="https://padang.go.id" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors inline-flex items-center gap-1">
                  &bull; Portal Resmi Pemko Padang <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://kpk.go.id" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors inline-flex items-center gap-1">
                  &bull; Portal KPK RI <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Kontak & Alamat */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-white text-sm tracking-wider uppercase">
              Kontak Kantor
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Jl. Bagindo Aziz Chan No. 1, Aie Pacah, Kota Padang, Sumatera Barat</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>(0751) 4640800</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>inspektorat@padang.go.id</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            &copy; {new Date().getFullYear()} Inspektorat Daerah Kota Padang. Seluruh Hak Cipta Dilindungi Undang-Undang.
          </p>
          <p className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Kepatuhan UU PDP No. 27 Tahun 2022
          </p>
        </div>
      </div>
    </footer>
  );
}
