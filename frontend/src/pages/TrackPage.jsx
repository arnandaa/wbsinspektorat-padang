import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  Download, 
  MessageSquare, 
  User, 
  Shield, 
  File,
  Paperclip,
  Check
} from 'lucide-react';

export default function TrackPage() {
  const [searchParams] = useSearchParams();
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Comment Form State (Two-Way Communication)
  const [commentText, setCommentText] = useState('');
  const [commentFile, setCommentFile] = useState(null);
  const [commentFileBase64, setCommentFileBase64] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Auto-search if token query param exists
  useEffect(() => {
    const tokenQuery = searchParams.get('token');
    if (tokenQuery) {
      setTokenInput(tokenQuery);
      fetchReport(tokenQuery);
    }
  }, [searchParams]);

  const fetchReport = async (token) => {
    const cleanToken = token.trim().toUpperCase();
    if (!cleanToken) {
      setErrorMessage('Silakan masukkan token pengaduan Anda.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setReport(null);
    setHistory([]);

    try {
      const res = await api.get(`/reports/track/${encodeURIComponent(cleanToken)}`);
      if (res.data.success && res.data.report) {
        setReport(res.data.report);
        setHistory(res.data.history || []);
      } else {
        setErrorMessage(res.data.message || 'Laporan dengan token tersebut tidak ditemukan.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mencari laporan. Periksa kembali token Anda.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReport(tokenInput);
  };

  const handleCommentFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran berkas maksimal 10MB.');
      return;
    }
    setCommentFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setCommentFileBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const payload = {
        token: report.token,
        note: commentText.trim(),
        file_name: commentFile ? commentFile.name : null,
        file_data: commentFileBase64 || null
      };

      const res = await api.post('/reports/comment', payload);
      if (res.data.success) {
        setCommentText('');
        setCommentFile(null);
        setCommentFileBase64('');
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 3000);
        // Refresh tracking data
        fetchReport(report.token);
      } else {
        alert(res.data.message || 'Gagal mengirim pesan.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan saat mengirim balasan.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Diajukan':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Menunggu Verifikasi</span>;
      case 'Diproses':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Sedang Diteliti</span>;
      case 'Ditindaklanjuti':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">Audit Investigasi</span>;
      case 'Selesai':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Selesai Ditindaklanjuti</span>;
      case 'Ditolak':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200">Tidak Dapat Ditindaklanjuti</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Title Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-slate-900">
          Lacak Status Pengaduan Anda
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Masukkan Token Rahasia yang Anda peroleh saat mengirimkan pengaduan untuk melihat perkembangan penanganan oleh Inspektorat.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Contoh: WBS-PADANG-XXXXXX"
              className="w-full pl-11 pr-4 py-3 text-sm sm:text-base font-mono uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-3 rounded-xl font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 transition-all flex items-center justify-center gap-2 shadow-xs shrink-0"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Cari Status</span>
            )}
          </button>
        </div>
      </form>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Result Section */}
      {report && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Card Ringkasan Laporan */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">KODE TOKEN:</span>
                <h2 className="text-xl sm:text-2xl font-black font-mono text-blue-950">
                  {report.token}
                </h2>
              </div>
              <div>{getStatusBadge(report.status)}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Kategori Pelanggaran:</span>
                <span className="font-bold text-slate-900">{report.category}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Tanggal Pengajuan:</span>
                <span className="font-medium text-slate-800">{report.date_submitted || report.dateSubmitted}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Lokasi / Instansi:</span>
                <span className="font-medium text-slate-800">{report.location}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Sifat Laporan:</span>
                <span className="font-medium text-slate-800">
                  {report.is_anonim || report.isAnonim ? 'Anonim (Identitas Dirahasiakan)' : 'Bernama (Dilindungi Hukum)'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs text-slate-500 font-semibold block">Judul Pokok Pengaduan:</span>
              <p className="font-bold text-slate-900 text-base">{report.title}</p>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs text-slate-500 font-semibold block">Kronologi Kejadian:</span>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/70 whitespace-pre-wrap leading-relaxed">
                {report.description}
              </p>
            </div>

            {/* Bukti Lampiran jika ada */}
            {(report.file_name || report.fileName) && (
              <div className="pt-2">
                <span className="text-xs text-slate-500 font-semibold block mb-2">Berkas Bukti Awal:</span>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-blue-900">
                  <File className="w-4 h-4 text-blue-700" />
                  <span>{report.file_name || report.fileName}</span>
                  {(report.file_data || report.fileData) && (
                    <a
                      href={report.file_data || report.fileData}
                      download={report.file_name || report.fileName}
                      className="ml-2 text-xs font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* LINIMASA RIWAYAT PENANGANAN & DISKUSI */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-blue-900" />
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Linimasa Perkembangan & Komunikasi
              </h3>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-6">
                Belum ada catatan tindak lanjut tambahan untuk pengaduan ini.
              </p>
            ) : (
              <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-6">
                {history.map((hist, idx) => {
                  const isUser = hist.is_user_msg || hist.isUserMsg;
                  return (
                    <div key={idx} className="relative group">
                      {/* Dot icon on timeline */}
                      <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                        isUser ? 'bg-amber-500' : 'bg-blue-900'
                      }`} />

                      <div className={`p-4 rounded-xl border ${
                        isUser ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
                      } space-y-2`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                          <span className={`font-bold ${isUser ? 'text-amber-800' : 'text-blue-900'}`}>
                            {isUser ? 'Pesan dari Anda (Pelapor)' : 'Catatan Resmi Inspektorat'}
                          </span>
                          <span className="text-slate-500">{hist.date}</span>
                        </div>

                        {hist.status && (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-600">Status Diperbarui ke: </span>
                            <span className="font-bold text-slate-900">{hist.status}</span>
                          </div>
                        )}

                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {hist.note}
                        </p>

                        {(hist.file_name || hist.fileName) && (
                          <div className="pt-2">
                            <a
                              href={hist.file_data || hist.fileData}
                              download={hist.file_name || hist.fileName}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-md border border-slate-200"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Lampiran: {hist.file_name || hist.fileName}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FORM KIRIM BALASAN / BUKTI TAMBAHAN OLEH PELAPOR */}
            <form onSubmit={handleCommentSubmit} className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <MessageSquare className="w-4 h-4 text-blue-800" />
                <span>Kirim Pesan Klarifikasi / Bukti Tambahan ke Tim Auditor</span>
              </div>

              {commentSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Pesan tambahan Anda berhasil dikirim ke tim Inspektorat!
                </div>
              )}

              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tuliskan keterangan tambahan atau tanggapan Anda di sini..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 w-fit">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span>{commentFile ? commentFile.name : 'Sematkan Lampiran (Opsional)'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleCommentFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  {submittingComment ? 'Mengirim...' : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Kirim Pesan Lanjutan
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>

        </div>
      )}

    </div>
  );
}
