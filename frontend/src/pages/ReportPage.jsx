import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  FileText, 
  UploadCloud, 
  ShieldCheck, 
  EyeOff, 
  UserCheck, 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  X, 
  File, 
  Lock,
  ArrowRight
} from 'lucide-react';

export default function ReportPage() {
  const navigate = useNavigate();

  // Form State
  const [isAnonim, setIsAnonim] = useState(true);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    incident_date: '',
    location: '',
    description: '',
    reporter_name: '',
    reporter_nik: '',
    reporter_email: '',
    reporter_hp: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success Modal State
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  const [copied, setCopied] = useState(false);

  const categories = [
    "Dugaan Korupsi / Kerugian Keuangan Daerah",
    "Pungutan Liar (Pungli)",
    "Pemberian Gratifikasi / Suap",
    "Penyalahgunaan Wewenang / Jabatan",
    "Pelanggaran Disiplin & Kode Etik ASN",
    "Pelayanan Publik Buruk / Diskriminasi",
    "Lainnya"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran berkas maksimal adalah 10MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
      if (file.type.startsWith('image/')) {
        setFilePreview(reader.result);
      } else {
        setFilePreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileBase64('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validasi Dasar
    if (!formData.category) {
      setErrorMessage('Silakan pilih kategori dugaan pelanggaran.');
      return;
    }
    if (!formData.title.trim()) {
      setErrorMessage('Judul pokok pengaduan wajib diisi.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMessage('Lokasi / Unit Kerja tempat kejadian wajib diisi.');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage('Uraian kronologi kejadian wajib diisi.');
      return;
    }

    // Jika pelapor memilih bernama, nama wajib diisi
    if (!isAnonim && !formData.reporter_name.trim()) {
      setErrorMessage('Karena Anda memilih pelaporan bernama, Nama Lengkap wajib diisi.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        is_anonim: isAnonim,
        category: formData.category,
        title: formData.title.trim(),
        incident_date: formData.incident_date,
        location: formData.location.trim(),
        description: formData.description.trim(),
        file_name: selectedFile ? selectedFile.name : null,
        file_data: fileBase64 || null,
        reporter_name: !isAnonim ? formData.reporter_name.trim() : null,
        reporter_nik: !isAnonim ? formData.reporter_nik.trim() : null,
        reporter_email: !isAnonim ? formData.reporter_email.trim() : null,
        reporter_hp: !isAnonim ? formData.reporter_hp.trim() : null,
      };

      const res = await api.post('/reports', payload);

      if (res.data.success && res.data.token) {
        setGeneratedToken(res.data.token);
        setSuccessModalOpen(true);
      } else {
        setErrorMessage(res.data.message || 'Gagal mengirim pengaduan. Silakan coba kembali.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan pada server saat mengirim pengaduan.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Form */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          Kanal Resmi WBS Kota Padang
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-slate-900">
          Formulir Pengaduan Dugaan Pelanggaran
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Silakan lengkapi formulir di bawah ini dengan informasi yang jelas dan akurat. Identitas Anda dijamin kerahasiaannya oleh hukum.
        </p>
      </div>

      {/* Alert Error Bila Ada */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-8">
        
        {/* BAGIAN 1: IDENTITAS PELAPOR */}
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold font-heading text-slate-900">
                1. Sifat Pelaporan
              </h2>
              <p className="text-xs text-slate-500">Pilih apakah Anda ingin melapor secara anonim atau menyertakan data diri.</p>
            </div>
            
            {/* Toggle Switch Anonim */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setIsAnonim(true)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isAnonim ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                Anonim (Rahasia)
              </button>
              <button
                type="button"
                onClick={() => setIsAnonim(false)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isAnonim ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Bernama (Identitas Dilindungi)
              </button>
            </div>
          </div>

          {/* Form Identitas Jika Bernama */}
          {!isAnonim && (
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-xs text-blue-900 font-semibold bg-blue-50/80 p-2.5 rounded-lg border border-blue-200/60">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Data pribadi Anda otomatis dienkripsi dengan standar militer AES-256 sebelum disimpan ke basis data.
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="reporter_name"
                  value={formData.reporter_name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK)
                </label>
                <input
                  type="text"
                  name="reporter_nik"
                  value={formData.reporter_nik}
                  onChange={handleInputChange}
                  placeholder="16 Digit NIK KTP"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email (Opsional)
                </label>
                <input
                  type="email"
                  name="reporter_email"
                  value={formData.reporter_email}
                  onChange={handleInputChange}
                  placeholder="alamat@email.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Telepon / WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  name="reporter_hp"
                  value={formData.reporter_hp}
                  onChange={handleInputChange}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* BAGIAN 2: SUBSTANSI PENGADUAN */}
        <div className="space-y-5">
          <h2 className="text-base font-bold font-heading text-slate-900">
            2. Rincian Dugaan Pelanggaran
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategori Pelanggaran <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-slate-800"
              >
                <option value="">-- Pilih Kategori Pelanggaran --</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Perkiraan Waktu / Tanggal Kejadian
              </label>
              <input
                type="date"
                name="incident_date"
                value={formData.incident_date}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Judul Pokok Pengaduan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Contoh: Dugaan Pungli Retribusi Izin di Dinas X"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lokasi / Instansi / Tempat Terjadinya Pelanggaran <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Contoh: Kantor Kecamatan Koto Tangah / Kantor Dinas Pendidikan"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Uraian Kronologi Kejadian (4W+1H) <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Uraikan secara jelas: Siapa pelakunya (nama/jabatan jika tahu), Apa yang terjadi, Kapan, Di mana, dan Bagaimana modus operandinya..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* BAGIAN 3: LAMPIRAN BUKTI */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold font-heading text-slate-900">
            3. Bukti Pendukung (Opsional namun Sangat Dianjurkan)
          </h2>

          {!selectedFile ? (
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
              <UploadCloud className="w-10 h-10 text-slate-400" />
              <div className="text-center">
                <span className="text-sm font-bold text-blue-900">Klik untuk mengunggah berkas</span>
                <span className="text-xs text-slate-500 block">Mendukung format gambar (JPG, PNG) atau dokumen (PDF). Maksimal 10MB.</span>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                    <File className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-slate-900 line-clamp-1">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                title="Hapus file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Tombol Kirim */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-7 py-3 rounded-md font-semibold text-white bg-[#0B192C] hover:bg-slate-800 disabled:bg-slate-400 shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mengirim Pengaduan...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Kirim Pengaduan Sekarang</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* SUCCESS MODAL POPUP */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg max-w-md w-full p-6 sm:p-7 space-y-5 shadow-lg border border-slate-200">
            
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold font-heading text-slate-900">
                Pengaduan Berhasil Terkirim
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Laporan Anda telah tercatat secara aman dalam pangkalan data Inspektorat Kota Padang. Catat dan simpan Token Pelacakan di bawah ini.
              </p>
            </div>

            {/* Token Card */}
            <div className="bg-slate-50 border border-slate-300 rounded-md p-4 text-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Token Pelacakan Anda</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 select-all tracking-wider">
                {generatedToken}
              </p>
              <button
                type="button"
                onClick={copyTokenToClipboard}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1 rounded transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Berhasil Disalin!' : 'Salin Token'}
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 leading-relaxed">
              <strong>Pemberitahuan Kerahasiaan:</strong> Simpan token ini dengan aman. Petugas verifikator tidak dapat memulihkan token Anda jika hilang demi menjaga independensi dan anonimitas pelapor.
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSuccessModalOpen(false);
                  navigate(`/lacak?token=${generatedToken}`);
                }}
                className="w-full py-2.5 rounded-md font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 text-sm shadow-xs"
              >
                <span>Pantau Status Pengaduan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuccessModalOpen(false);
                  navigate('/');
                }}
                className="w-full py-2 rounded-md font-medium text-slate-600 hover:bg-slate-100 transition-colors text-xs"
              >
                Kembali ke Beranda
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
