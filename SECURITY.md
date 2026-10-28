# Security Policy, Threat Model & Hardening Guide
## Whistleblowing System (WBS) - Inspektorat Kota Padang

---

### 1. KEBIJAKAN KEAMANAN INFORMASI (SECURITY POLICY)
Sistem Pengaduan Pelanggaran (*Whistleblowing System*) Inspektorat Daerah Kota Padang memproses data yang memiliki klasifikasi **Sangat Rahasia (Confidential & Protected)**. Keberhasilan sistem ini bergantung sepenuhnya pada kepercayaan masyarakat dan aparatur terhadap jaminan keamanan identitas mereka.

Prinsip utama keamanan sistem ini:
1. **Prinsip Kerahasiaan Mutlak (Absolute Confidentiality):** Tidak seorang pun, termasuk pengelola server atau tim verifikator tingkat awal, dapat melihat identitas pelapor anonim karena data identitas memang tidak pernah dikumpulkan atau disimpan.
2. **Kriptografi Berlapis (Defense in Depth):** Bilamana pelapor memilih opsi bernama, data pribadi (Nama, NIK, No. HP, Email) disimpan dalam bentuk terenkripsi kriptografis menggunakan algoritma standar industri militer **AES-256-CBC/GCM** via Laravel Cryptography Engine.
3. **Isolasi Berkas Bukti (Zero Public File Exposure):** Dokumen bukti laporan disimpan dalam **Supabase Storage Bucket Private**. Berkas sama sekali tidak dapat diakses melalui URL publik langsung, melainkan wajib melalui *Signed URL* berwaktu kedaluwarsa singkat (15 menit) yang hanya dapat digenerate oleh admin terotentikasi.
4. **Kepatuhan Hukum Perlindungan Data:** Sistem dirancang selaras dengan mandat **Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)** serta regulasi Komisi Pemberantasan Korupsi (KPK) terkait perlindungan saksi dan pelapor tindak pidana korupsi.

---

### 2. THREAT MODELING (ANALISIS ANCAMAN STRIDE)

| Ancaman (STRIDE) | Skenario Ancaman Potensial | Dampak Risiko | Mitigasi yang Diterapkan dalam Sistem Baru |
| :--- | :--- | :--- | :--- |
| **Spoofing (Pemalsuan Identitas)** | Penyerang mencoba menebak username/password admin untuk membajak dashboard inspektorat. | **Kritis** (Akses tidak sah ke data pengaduan). | Hashing kata sandi Bcrypt (*cost factor* 12), pelacakan login gagal via `RateLimiter` dengan lockout otomatis 15 menit setelah 5x percobaan, serta token stateless **Laravel Sanctum**. |
| **Tampering (Manipulasi Data)** | Penyerang mencoba memodifikasi status laporan atau file lampiran. | **Tinggi** (Integritas bukti rusak, rekayasa kasus). | *Eloquent ORM parameterized queries* pada semua rute database; berkas lampiran di Supabase Storage hanya dapat ditulis melalui API backend resmi. |
| **Repudiation (Penyangkalan Tindakan)** | Admin atau pihak tertentu menyangkal telah mengubah status atau menghapus laporan. | **Sedang** (Akuntabilitas proses hilang). | Pencatatan audit terperinci (*audit trail*) di tabel `report_history` mencakup timestamp, catatan verifikator, dan user ID pelaku aksi. |
| **Information Disclosure (Kebocoran Data)** | Penyerang mencoba mengakses file `.env`, backup database, atau melihat bukti lampiran secara publik. | **Kritis** (Kunci enkripsi & seluruh data laporan bocor). | Frontend React di Vercel terpisah dari Backend; file `.env` diisolasi di server environment; bucket Supabase disetel *Private* (hanya bisa diakses via *Signed URL*). |
| **Denial of Service (DoS / DDoS)** | Pengiriman request masif ke endpoint submit laporan untuk melumpuhkan server. | **Tinggi** (Layanan pengaduan tidak dapat diakses warga). | Middleware `throttle:100,1` (maksimal 100 request/menit untuk API publik) dan `throttle:5,1` untuk endpoint login di Laravel, dilindungi Vercel DDoS Protection di lapisan edge. |
| **Elevation of Privilege (Eskalasi Hak Akses)** | Pengguna publik mencoba mengakses endpoint khusus pengawas seperti `/api/admin/reports`. | **Kritis** (Warga biasa bisa melihat laporan orang lain). | Rute admin dilindungi middleware `auth:sanctum`. Permintaan tanpa token valid seketika ditolak dengan respon HTTP `401 Unauthorized`. |

---

### 3. ARSITEKTUR KRIPTOGRAFI & PROTEKSI DATA

#### 3.1 Enkripsi Data Pribadi Pelapor (AES-256 via Laravel Crypt)
Ketika pelapor memilih opsi tidak anonim, data Nama, NIK, Email, dan No. HP dienkripsi secara otomatis menggunakan fasilitas kriptografi Laravel:
- **Algoritma:** AES-256-CBC atau AES-256-GCM (dikonfigurasi pada `config/app.php`).
- **Kunci Enkripsi:** 256-bit berasal dari `APP_KEY` terkelola.
- **Message Authentication Code (MAC):** Setiap string terenkripsi dilengkapi dengan tanda tangan HMAC SHA-256 untuk mendeteksi setiap upaya manipulasi bit data (*tamper detection*).
- **Implementasi Model Eloquent:**
  ```php
  // Menggunakan Laravel Encrypted Casts atau Accessor/Mutator otomatis
  protected $casts = [
      'reporter_name' => 'encrypted',
      'reporter_nik' => 'encrypted',
      'reporter_email' => 'encrypted',
      'reporter_hp' => 'encrypted',
      'is_anonim' => 'boolean',
  ];
  ```

#### 3.2 Hashing Kredensial Administrator (Bcrypt)
- Password administrator tidak pernah disimpan dalam format teks polos (*plaintext*).
- Menggunakan fungsi bawaan `Hash::make($password, ['rounds' => 12])`.
- Verifikasi aman dilakukan melalui `Hash::check($password, $user->password)` yang kebal terhadap serangan *timing attack*.

#### 3.3 Autentikasi Sesi Stateless (Laravel Sanctum)
- Login sukses menghasilkan *Personal Access Token* yang disimpan dalam bentuk hash SHA-256 pada tabel `personal_access_tokens`.
- Token dikirimkan oleh klien React menggunakan header HTTP:
  ```text
  Authorization: Bearer <TOKEN>
  ```
- **Masa Berlaku Token:** 8 jam (*sliding expiration*). Token dapat dicabut sewaktu-waktu (*revoked*) oleh admin saat melakukan logout.

#### 3.4 Isolasi Berkas Lampiran (Supabase Storage Private Bucket)
- Bukti lampiran pengaduan diunggah ke bucket privat `wbs-evidence`.
- Akses berkas oleh verifikator Inspektorat dilakukan melalui *Time-limited Signed URL*:
  ```php
  // Menghasilkan URL sementara dengan masa aktif 15 menit
  $signedUrl = $supabaseStorage->createSignedUrl('wbs-evidence', $filePath, 900);
  ```
- URL ini otomatis hangus setelah 15 menit, mencegah pembocoran tautan ke pihak luar yang tidak berhak.

---

### 4. PENGAMANAN LAPISAN APLIKASI (APPLICATION LAYER HARDENING)

#### 4.1 Cross-Origin Resource Sharing (CORS) Ketat
Konfigurasi `config/cors.php` pada Laravel secara tegas membatasi domain asal request:
```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
    'allowed_origins' => [
        'https://wbs.padang.go.id',
        'http://localhost:5173', // Khusus lingkungan development
    ],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
    'supports_credentials' => true,
];
```

#### 4.2 Content Security Policy & Security Headers (Vercel & Laravel)
Pada `vercel.json` untuk frontend React:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" }
      ]
    }
  ]
}
```

#### 4.3 Pembatasan Laju Akses (Rate Limiting)
- **API Publik (`routes/api.php`):** Diterapkan `throttle:100,1` (maksimal 100 permintaan/menit per IP).
- **Endpoint Autentikasi (`/api/login`):** Diterapkan `throttle:5,1` (maksimal 5 percobaan/menit). Jika gagal 5 kali berturut-turut, fungsi `RateLimiter::tooManyAttempts()` memblokir akses selama 15 menit.

---

### 5. CHECKLIST HARDENING SEBELUM DEPLOY PRODUKSI

Lakukan verifikasi terhadap daftar periksa berikut sebelum sistem dibuka untuk publik:

- [x] **Variabel Lingkungan Aman:** Berkas `.env` tidak pernah disertakan dalam commit Git (`.gitignore` telah terkonfigurasi pada React dan Laravel).
- [x] **App Key Laravel Unik:** Jalankan `php artisan key:generate` untuk menghasilkan kunci AES-256 unik berukuran 32 byte.
- [x] **Supabase Storage Private:** Pastikan bucket `wbs-evidence` berstatus **Private** (bukan *Public Bucket*).
- [x] **Koneksi Supabase SSL:** Konfigurasi koneksi database wajib menggunakan string pooler Supavisor dengan `sslmode=require`.
- [x] **Ganti Kredensial Default:** Ubah username default `admin` dan password awal menjadi kata sandi yang kompleks (> 14 karakter, kombinasi huruf besar, kecil, angka, dan simbol).
- [x] **Enkripsi HTTPS Wajib:** Pastikan frontend di Vercel dan API backend berjalan dengan sertifikat SSL TLS 1.3 valid.
- [x] **CORS Terkunci:** Domain CORS backend dikunci hanya ke domain resmi Vercel / domain instansi Pemko Padang.

---

### 6. PROSEDUR PENANGANAN INSIDEN KEAMANAN (INCIDENT RESPONSE PLAN)

Bila terdeteksi indikasi insiden siber (misalnya kebocoran data atau serangan brute force masif):
1. **Identifikasi & Isolasi:** 
   - Putuskan sementara koneksi publik atau aktifkan mode pemeliharaan via `php artisan down`.
   - Analisis log Laravel (`storage/logs/laravel.log`) dan log akses Vercel/Supabase.
2. **Revokasi Kunci & Sesi:**
   - Cabut seluruh token aktif via `DB::table('personal_access_tokens')->delete()`.
   - Ganti password admin dan putar ulang kunci API Supabase jika dicurigai terdampak.
3. **Pemberitahuan & Forensik:**
   - Laporkan insiden ke Tim Tanggap Insiden Keamanan Siber Pemerintah Daerah (Padang-CSIRT) dan Diskominfotik Kota Padang.
   - Periksa keutuhan catatan pada tabel `reports` dan `report_history`.
4. **Pemulihan (*Recovery*):**
   - Pulihkan data dari *Point-in-Time Recovery* Supabase ke titik sebelum insiden.
   - Rilis pembaruan keamanan dan aktifkan kembali layanan.

---

### 7. PELAPORAN KERENTANAN (VULNERABILITY DISCLOSURE)
Jika Anda menemukan potensi celah keamanan pada sistem ini, mohon untuk tidak mengeksploitasinya. Laporkan temuan Anda secara bertanggung jawab kepada:
- **Email Keamanan:** `inspektorat@padang.go.id` / `csirt@padang.go.id`
- **Subjek Email:** `[SECURITY VULNERABILITY] WBS Inspektorat Padang`
- Tim pengembang akan merespon laporan dalam waktu maksimal 2 x 24 jam kerja.
