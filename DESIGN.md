# DESIGN.md — Panduan Desain & Visual Identity WBS Inspektorat Kota Padang

> **Status:** Dokumen Resmi Arah Desain (Design Direction)  
> **Filter Penerapan:** Anti-Slop Mode: DURING (`antislop active: during (session override).`)  
> **Dials:** ENERGY: 2 | RHYTHM: 2 | MOTION: 1

---

## 1. Identitas & Karakter Desain

Sistem Pengaduan Pelanggaran (Whistleblowing System - WBS) Inspektorat Daerah Kota Padang adalah platform layanan publik resmi untuk menampung, memverifikasi, dan menindaklanjuti laporan dugaan korupsi, pungutan liar, gratifikasi, serta pelanggaran integritas ASN di lingkungan Pemerintah Kota Padang.

Karakter visual harus mencerminkan:
- **Kredibilitas Institusional:** Berwibawa, tertib, dan mencerminkan instansi pengawasan pemerintah daerah.
- **Rasa Aman & Kerahasiaan (Discreet & Secure):** Pelapor harus langsung merasakan bahwa identitas dan bukti mereka terlindungi secara mutlak (UU PDP No. 27/2022, enkripsi AES-256).
- **Kejelasan Alur (Clarity over Gimmicks):** Alur pelaporan dan pengecekan status laporan harus jelas, tanpa dekorasi grafis yang mengaburkan pesan atau membingungkan pengguna awam.

---

## 2. Palet Warna (Color Palette)

Menghindari gradien generik ungu-biru AI atau palet SaaS neon yang tidak kontekstual. Warna diambil dari identitas resmi instansi kepemerintahan Kota Padang:

| Peran | Nilai Hex | Kelas Tailwind | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Primary Navy** | `#0B192C` | `bg-slate-950` / `#0B192C` | Latar belakang hero, header otoritas, elemen institusional utama |
| **Navy Structural** | `#1E3E62` | `bg-slate-800` / `#1E3E62` | Kartu utama, navigasi, batas panel penting |
| **Accent Padang Maroon** | `#8B181B` | `text-rose-800` / `bg-rose-900` | Penanda identitas daerah Minang/Padang, peringatan tegas, badge resmi |
| **Seal Gold / Amber** | `#D97706` | `text-amber-500` / `bg-amber-500` | Aksen stempel verifikasi, token keamanan, status proses pengaduan |
| **Surface Crisp White** | `#FFFFFF` | `bg-white` | Kartu formulir, bidang input, panel data admin |
| **Surface Dim** | `#F8FAFC` | `bg-slate-50` | Latar belakang halaman publik dan latar belakang form |
| **Text Primary** | `#0F172A` | `text-slate-900` | Teks judul, label penting, konten utama (kontras tinggi WCAG AAA) |
| **Text Muted** | `#475569` | `text-slate-600` | Teks penjelasan, petunjuk bantuan, metadata |
| **Border Solid** | `#E2E8F0` / `#CBD5E1` | `border-slate-200` | Garis batas struktural tegas (bukan bayangan buram mengambang) |

---

## 3. Tipografi

- **Judul & Headline (Display/Heading):**  
  `Plus Jakarta Sans` / `Public Sans` (semibold 600 atau bold 700, `tracking-tight`).  
  *Aturan anti-slop:* Warna judul harus solid (putih di latar gelap, slate-900 di latar terang). **Dilarang keras memakai teks gradien pelangi/ungu-biru (`bg-clip-text text-transparent`)** yang terbaca seperti template AI.
- **Teks Konten (Body Text):**  
  `Inter` (regular 400 & medium 500), ukuran dasar 15-16px, line-height 1.6 untuk keterbacaan dokumen publik.
- **Data Teknis & Token (Monospace):**  
  `JetBrains Mono` / `ui-monospace` untuk Token ID Pengaduan (`WBS-PADANG-XXXXXX`), tanggal stempel waktu, dan indikator enkripsi.

---

## 4. Skala Radius & Bayangan (Geometry & Elevation)

Sesuai aturan R-11 dan R-14 Anti-Slop:
- **Radius Tombol & Input:** `rounded-md` (6px) untuk kesan presisi dan rapi.
- **Radius Kartu & Panel:** `rounded-lg` (8px hingga 12px) untuk kontainer konten.
- **Pill Shape (`rounded-full`):** **Hanya digunakan untuk badge status kecil** (misal: "Baru", "Diproses", "Selesai"), bukan untuk kartu atau seluruh tombol.
- **Bayangan (Shadows):** Menggunakan bayangan tajam dan subtil (`shadow-sm`, `shadow`), dipadukan dengan border 1px solid (`border border-slate-200`). Tidak menggunakan bayangan buram 40px yang membuat antarmuka terasa melayang tanpa struktur.

---

## 5. Dials & Pedoman Gerak (Motion & Interaction)

- **ENERGY: 2 (Dignified & Reassuring):**  
  Tata letak tenang, profesional, dan menumbuhkan rasa percaya. Kontras tinggi, informasi tersusun logis tanpa elemen visual yang berteriak-teriak.
- **RHYTHM: 2 (Intentional Hierarchy):**  
  Struktur halaman mengutamakan 2 aksi utama publik:
  1. Melaporkan pelanggaran (`/lapor`)
  2. Melacak status laporan (`/pantau`)  
  Informasi alur, dasar hukum, dan statistik disusun secara proporsional.
- **MOTION: 1 (Functional Transitions Only):**  
  Transisi hanya untuk feedback interaksi (`transition-colors duration-150`, `focus:ring-2 focus:ring-blue-600`). Tidak ada animasi memantul (*bouncy spring*), partikel melayang, atau parallax berlebih.

---

## 6. Copywriting & Gaya Bahasa (Anti-Slop Copy)

- Menggunakan Bahasa Indonesia baku kedinasan yang jelas, lugas, dan empatik.
- **Dilarang:** Kalimat marketing startup AI ("Platform mutakhir bertenaga AI", "Revolusi pengaduan masa depan", "Mulai petualangan Anda hari ini").
- **Gunakan:** Kalimat layanan publik yang terukur ("Layanan Aspirasi & Pengaduan Pelanggaran Inspektorat Kota Padang", "Identitas Anda dijamin aman sesuai ketentuan perundang-undangan").
