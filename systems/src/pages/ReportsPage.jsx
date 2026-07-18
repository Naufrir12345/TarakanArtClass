import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileSpreadsheet, Plus, Trash2, Key, Printer, Eye, X, BookOpen, Send } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [addGradeModalOpen, setAddGradeModalOpen] = useState(false);
  
  // Create Report form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [periode, setPeriode] = useState('2026-Semester-1');
  const [catatan, setCatatan] = useState('');

  // Add Grade sub-form state
  const [activeReportId, setActiveReportId] = useState(null);
  const [namaKelas, setNamaKelas] = useState('Menggambar');
  const [nilaiAngka, setNilaiAngka] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Selected Report view state (for print template)
  const [viewReport, setViewReport] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, studentsRes] = await Promise.all([
        api.get('/api/reports'),
        api.get('/api/students'),
      ]);
      setReports(reportsRes.data);
      setStudents(studentsRes.data.data);
    } catch (err) {
      console.error('Error fetching reports data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Pilih siswa terlebih dahulu');
      return;
    }
    try {
      await api.post('/api/reports', {
        studentId: selectedStudentId,
        periode,
        catatan,
      });
      fetchData();
      setModalOpen(false);
      setSelectedStudentId('');
      setCatatan('');
    } catch (err) {
      alert('Gagal membuat rapor: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenAddGrade = (reportId) => {
    setActiveReportId(reportId);
    setNilaiAngka('');
    setKeterangan('');
    setAddGradeModalOpen(true);
  };

  const handleAddGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/reports/${activeReportId}/grades`, {
        namaKelas,
        nilaiAngka: parseFloat(nilaiAngka),
        keterangan,
      });
      fetchData();
      setAddGradeModalOpen(false);
    } catch (err) {
      alert('Gagal menambah nilai');
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (confirm('Hapus nilai subjek ini?')) {
      try {
        await api.delete(`/api/reports/grades/${gradeId}`);
        fetchData();
        // Update view if open
        if (viewReport) {
          const updatedView = await api.get(`/api/reports/${viewReport.id}`);
          setViewReport(updatedView.data);
        }
      } catch (err) {
        alert('Gagal menghapus nilai');
      }
    }
  };

  const handleDeleteReport = async (id) => {
    if (confirm('Hapus rapor ini beserta seluruh nilainya?')) {
      try {
        await api.delete(`/api/reports/${id}`);
        fetchData();
      } catch (err) {
        alert('Gagal menghapus rapor');
      }
    }
  };

  const handleShareWhatsApp = (report) => {
    const student = report.student;
    const phone = student.noHpOrtu || '';
    
    // Bersihkan nomor telepon
    const cleanPhone = phone.replace(/\D/g, '');
    let waPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) {
      waPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      waPhone = '62' + cleanPhone;
    }
    
    const publicUrl = `${window.location.origin}/rapor-anak?key=${report.credentialKey}`;
    const message = `Halo Ayah/Bunda dari *${student.namaAnak}*, berikut kami kirimkan Rapor Perkembangan Belajar anak untuk periode *${report.periode}*.\n\nDetail rapor dapat langsung diakses melalui tautan berikut:\n${publicUrl}\n\nTerima kasih atas perhatiannya!\n- Manufindo Kids Center`;
    
    const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Rapor Siswa</h1>
          <p className="text-slate-500 mt-1">Smart grading system & credential key rapor anak</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 self-start"
        >
          <Plus size={18} />
          <span>Buat Rapor Baru</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-10">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : reports.length === 0 ? (
          <div className="col-span-2 text-center text-slate-400 py-10 text-sm">Belum ada rapor dibuat.</div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{report.student.namaAnak}</h3>
                    <p className="text-xs text-slate-400">Periode: {report.periode}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                    title="Hapus Rapor"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Score Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nilai Rata-Rata</div>
                    <div className="text-2xl font-black text-slate-800">
                      {report.nilaiRataRata !== null ? report.nilaiRataRata : '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kategori</div>
                    <div className="text-2xl font-black text-indigo-600">
                      {report.nilaiAbjad !== null ? report.nilaiAbjad : '-'}
                    </div>
                  </div>
                </div>

                {/* Credential Key */}
                <div className="flex items-center space-x-2 text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-xl border border-amber-100/50">
                  <Key size={14} className="shrink-0" />
                  <span className="font-semibold">Key Orang Tua:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200">{report.credentialKey}</span>
                </div>

                {/* Subject List preview */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nilai Sub-jek:</div>
                  {report.grades.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">Belum ada nilai subjek. Silakan input.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {report.grades.map(g => (
                        <div key={g.id} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center space-x-1">
                          <span>{g.namaKelas}: {g.nilaiAngka} ({g.nilaiAbjad})</span>
                          <button onClick={() => handleDeleteGrade(g.id)} className="hover:text-red-600 font-bold ml-1">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleOpenAddGrade(report.id)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Plus size={14} />
                  <span>Input Nilai</span>
                </button>
                <button
                  onClick={() => handleShareWhatsApp(report)}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                  title="Kirim ke Orang Tua via WA"
                >
                  <Send size={14} />
                  <span>Kirim WA</span>
                </button>
                <button
                  onClick={() => setViewReport(report)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Eye size={14} />
                  <span>Lihat</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Buat Rapor Baru</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Siswa
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm text-slate-800"
                >
                  <option value="">Pilih Siswa...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.namaAnak}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Periode Rapor
                </label>
                <input
                  type="text"
                  required
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  placeholder="Contoh: 2026-Semester-1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Catatan Guru (Opsional)
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows="3"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                >
                  Buat Rapor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Grade Modal */}
      {addGradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAddGradeModalOpen(false)} />
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Input Nilai Kelas</h2>
              <button onClick={() => setAddGradeModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddGradeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Sub-jek / Mata Pelajaran
                </label>
                <select
                  value={namaKelas}
                  onChange={(e) => setNamaKelas(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm text-slate-800"
                >
                  <option value="Menggambar">Menggambar</option>
                  <option value="Bermain & Motorik">Bermain & Motorik</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="Membaca & Menulis">Membaca & Menulis</option>
                  <option value="Matematika Logika">Matematika Logika</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nilai Angka (0-100)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={nilaiAngka}
                  onChange={(e) => setNilaiAngka(e.target.value)}
                  placeholder="Masukkan nilai..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Keterangan / Deskripsi (Opsional)
                </label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Komentar perkembangan anak..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddGradeModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Report Detail View */}
      {viewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto no-print">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl relative z-10 flex flex-col my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Detail Rapor Cetak</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center space-x-1.5 text-xs font-bold"
                >
                  <Printer size={14} />
                  <span>Cetak Rapor</span>
                </button>
                <button onClick={() => setViewReport(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="p-8 space-y-6 overflow-y-auto max-h-[500px]" id="print-area">
              <div className="text-center pb-4 border-b-2 border-indigo-600">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">RAPOR PERKEMBANGAN BELAJAR</h2>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">MANUFINDO LES KIDS CENTER</p>
              </div>

              {/* Student info details */}
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Nama Siswa</div>
                  <div className="font-bold">{viewReport.student.namaAnak}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Periode Belajar</div>
                  <div className="font-bold">{viewReport.periode}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Umur Anak</div>
                  <div>{viewReport.student.umur} Tahun</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Nama Orang Tua</div>
                  <div>{viewReport.student.namaOrtu}</div>
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
                  {viewReport.grades.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-slate-400 italic">Belum ada nilai subjek.</td>
                    </tr>
                  ) : (
                    viewReport.grades.map(g => (
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
                  <div className="text-xl font-black text-slate-800">{viewReport.nilaiRataRata || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Predikat Akhir</div>
                  <div className="text-xl font-black text-indigo-600">{viewReport.nilaiAbjad || '-'}</div>
                </div>
              </div>

              {/* Catatan Guru */}
              <div className="space-y-1 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="text-xs uppercase font-bold text-slate-400">Catatan & Saran Guru:</div>
                <p className="text-xs text-slate-600 italic">
                  {viewReport.catatan || 'Anak aktif berpartisipasi dan menunjukkan ketertarikan tinggi pada aktivitas kelas.'}
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
        </div>
      )}
    </div>
  );
}
