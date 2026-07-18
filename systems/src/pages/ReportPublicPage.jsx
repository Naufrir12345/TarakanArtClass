import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Key, Printer, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function ReportPublicPage() {
  const [searchParams] = useSearchParams();
  const [credentialKey, setCredentialKey] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyKey = async (key) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/reports/verify', { credentialKey: key });
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Credential key tidak valid. Silakan periksa kembali.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const keyParam = searchParams.get('key');
    if (keyParam) {
      const upperKey = keyParam.toUpperCase();
      setCredentialKey(upperKey);
      verifyKey(upperKey);
    }
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (credentialKey) {
      await verifyKey(credentialKey);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const daysLabel = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      {/* Decorative gradient background circles */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse no-print" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700 no-print" />

      {/* Access Key Input Form (No Print) */}
      {!report && (
        <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-xl relative z-10 no-print">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-md mb-3">
              M
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Akses Rapor Anak</h2>
            <p className="text-sm text-slate-500 mt-1">Masukkan key credential yang diberikan oleh admin les</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Credential Key Rapor
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Key size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={credentialKey}
                  onChange={(e) => setCredentialKey(e.target.value.toUpperCase())}
                  placeholder="CONTOH: A7B8F9C1"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-slate-800 font-mono tracking-widest text-center text-lg uppercase font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold transition-all shadow-md flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Buka Rapor</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Rapor Card Display (Print Friendly) */}
      {report && (
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden relative z-10 flex flex-col">
          {/* Header Controls (No Print) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 no-print">
            <button
              onClick={() => setReport(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Kembali
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Printer size={14} />
              <span>Cetak Rapor</span>
            </button>
          </div>

          {/* Rapor Content Print Area */}
          <div className="p-8 space-y-6" id="print-area">
            <div className="text-center pb-4 border-b-2 border-indigo-600">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">RAPOR PERKEMBANGAN BELAJAR</h2>
              <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">MANUFINDO LES KIDS CENTER</p>
            </div>

            {/* Student info details */}
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Nama Siswa</div>
                <div className="font-bold">{report.student.namaAnak}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Periode Belajar</div>
                <div className="font-bold">{report.periode}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Umur Anak</div>
                <div>{report.student.umur} Tahun</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Nama Orang Tua</div>
                <div>{report.student.namaOrtu}</div>
              </div>
            </div>

            {/* Grades Table */}
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-indigo-600/30 bg-slate-50">
                  <th className="py-2.5 font-bold text-slate-700">Sub-jek Kelas</th>
                  <th className="py-2.5 font-bold text-slate-700 text-center">Nilai Angka</th>
                  <th className="py-2.5 font-bold text-slate-700 text-center">Kategori</th>
                  <th className="py-2.5 font-bold text-slate-700">Perkembangan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.grades.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400 italic">Belum ada nilai subjek.</td>
                  </tr>
                ) : (
                  report.grades.map(g => (
                    <tr key={g.id}>
                      <td className="py-3 font-semibold text-slate-800">{g.namaKelas}</td>
                      <td className="py-3 text-center font-mono font-bold">{g.nilaiAngka}</td>
                      <td className="py-3 text-center font-bold text-indigo-600">{g.nilaiAbjad}</td>
                      <td className="py-3 text-slate-500 text-xs">{g.keterangan || 'Berkembang baik.'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/20 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Nilai Akhir Rata-Rata</div>
                <div className="text-xl font-black text-slate-800">{report.nilaiRataRata || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Predikat Akhir</div>
                <div className="text-xl font-black text-indigo-600">{report.nilaiAbjad || '-'}</div>
              </div>
            </div>

            {/* Catatan Guru */}
            <div className="space-y-1 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="text-xs uppercase font-bold text-slate-400">Catatan & Saran Guru:</div>
              <p className="text-xs text-slate-600 italic">
                {report.catatan || 'Anak aktif berpartisipasi dan menunjukkan ketertarikan tinggi pada aktivitas kelas.'}
              </p>
            </div>

            {/* Signature block */}
            <div className="flex justify-between items-end pt-12 text-sm text-slate-700">
              <div className="text-center w-36 border-t border-slate-300 pt-1">
                Orang Tua Siswa
              </div>
              <div className="text-center w-44 border-t border-slate-300 pt-1">
                Kepala Unit Les
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
