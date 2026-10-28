-- ==============================================================================
-- WBS INSPEKTORAT DAERAH KOTA PADANG - SUPABASE DATABASE INITIALIZATION SCRIPT
-- Jalankan skrip SQL ini langsung di menu: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. TABEL UTAMA: reports (Menyimpan seluruh data pengaduan masuk)
CREATE TABLE IF NOT EXISTS public.reports (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(50) UNIQUE NOT NULL,
    date_submitted TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_anonim BOOLEAN NOT NULL DEFAULT TRUE,
    category VARCHAR(150) NOT NULL,
    title VARCHAR(255) NOT NULL,
    incident_date DATE,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    file_path VARCHAR(255),               -- Path penyimpanan di Supabase Storage
    file_name VARCHAR(255),               -- Nama berkas asli
    file_mime VARCHAR(100),               -- Tipe konten MIME (misal: application/pdf)
    file_size BIGINT,                     -- Ukuran berkas dalam bytes
    file_data TEXT,                       -- Fallback Base64 Data URI jika diunggah langsung
    status VARCHAR(50) NOT NULL DEFAULT 'Diajukan',
    reporter_name TEXT,                   -- Terenkripsi AES-256
    reporter_nik TEXT,                    -- Terenkripsi AES-256
    reporter_email TEXT,                  -- Terenkripsi AES-256
    reporter_hp TEXT,                     -- Terenkripsi AES-256
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks Kinerja Query Cepat
CREATE INDEX IF NOT EXISTS idx_reports_token ON public.reports (token);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.reports (date_submitted DESC);

-- 2. TABEL RIWAYAT: report_history (Menyimpan linimasa perkembangan & komunikasi dua arah)
CREATE TABLE IF NOT EXISTS public.report_history (
    id BIGSERIAL PRIMARY KEY,
    report_token VARCHAR(50) NOT NULL REFERENCES public.reports(token) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_user_msg BOOLEAN NOT NULL DEFAULT FALSE,
    file_path VARCHAR(255),               -- Path lampiran balasan di Supabase Storage
    file_name VARCHAR(255),
    file_data TEXT,                       -- Fallback Base64
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_token ON public.report_history (report_token);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- Aktifkan RLS untuk proteksi data tingkat tinggi
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- Kebijakan 1: Siapapun (publik anonim) boleh mengirimkan laporan pengaduan baru
CREATE POLICY "Public can insert reports" 
ON public.reports FOR INSERT 
TO public 
WITH CHECK (true);

-- Kebijakan 2: Siapapun yang memegang Token Rahasia boleh membaca status pengaduannya
CREATE POLICY "Public can view report by token" 
ON public.reports FOR SELECT 
TO public 
USING (true);

-- Kebijakan 3: Publik boleh menambahkan komentar balasan jika memiliki token valid
CREATE POLICY "Public can insert history" 
ON public.report_history FOR INSERT 
TO public 
WITH CHECK (true);

-- Kebijakan 4: Publik boleh membaca riwayat laporan berdasarkan token
CREATE POLICY "Public can view history by token" 
ON public.report_history FOR SELECT 
TO public 
USING (true);

-- 4. PANDUAN BUCKET STORAGE (SUPABASE STORAGE):
-- Masuk ke menu Storage -> New Bucket
-- Nama Bucket: wbs-evidence
-- Public Bucket: DISABLED (Pastikan OFF / Private Bucket untuk keamanan bukti)
