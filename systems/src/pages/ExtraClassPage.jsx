import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, X, GraduationCap, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function ExtraClassPage() {
  const [extraClasses, setExtraClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Booking Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [extraRes, studentsRes, classesRes] = await Promise.all([
        api.get('/api/extra-classes'),
        api.get('/api/students'),
        api.get('/api/classes'),
      ]);
      setExtraClasses(extraRes.data);
      setStudents(studentsRes.data.data);
      setClasses(classesRes.data);
    } catch (err) {
      console.error('Error fetching extra classes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExtraClass = async (e) => {
    e.preventDefault();
    if (!studentId || !classId) {
      alert('Pilih siswa dan kelas terlebih dahulu');
      return;
    }

    try {
      await api.post('/api/extra-classes', {
        studentId,
        classId,
        date: new Date(date).toISOString(),
        startTime,
        endTime,
        notes,
      });
      alert('Extra Class berhasil dijadwalkan! Tagihan pembayaran otomatis dibuat.');
      fetchData();
      setModalOpen(false);
      setStudentId('');
      setClassId('');
      setDate('');
      setNotes('');
    } catch (err) {
      alert('Gagal menjadwalkan Extra Class: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (confirm(`Ubah status kelas tambahan ini menjadi ${status}?`)) {
      try {
        await api.patch(`/api/extra-classes/${id}/status`, { status });
        alert('Status berhasil diubah');
        fetchData();
      } catch (err) {
        alert('Gagal mengubah status');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Extra Class</h1>
          <p className="text-slate-500 mt-1">Penjadwalan kelas tambahan per minggu (otomatis buat tagihan)</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 self-start"
        >
          <Plus size={18} />
          <span>Jadwalkan Extra Class</span>
        </button>
      </div>

      {/* Warning Tip */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start space-x-3 text-sm text-amber-800">
        <AlertCircle className="shrink-0 text-amber-600 mt-0.5" size={18} />
        <div>
          <strong>Info Sistem Cerdas:</strong> Menjadwalkan Extra Class di sini akan secara otomatis membuat tagihan invoice 
          baru tipe <code>EXTRA_CLASS</code> pada menu Pembayaran sesuai dengan harga kelas yang dipilih.
        </div>
      </div>

      {/* List Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Siswa</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mata Pelajaran</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal Kelas</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : extraClasses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                    Belum ada jadwal extra class.
                  </td>
                </tr>
              ) : (
                extraClasses.map((ec) => {
                  const isScheduled = ec.status === 'SCHEDULED';
                  return (
                    <tr key={ec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">{ec.student.namaAnak}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                          {ec.class.namaKelas}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(ec.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                        {ec.startTime} - {ec.endTime}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ec.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-600'
                              : ec.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-indigo-50 text-indigo-600'
                          }`}
                        >
                          {ec.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isScheduled && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateStatus(ec.id, 'CANCELLED')}
                              className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-semibold transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(ec.id, 'COMPLETED')}
                              className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-semibold transition-colors"
                            >
                              Selesai
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Extra Class Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Jadwalkan Extra Class</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExtraClass} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Siswa
                </label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
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
                  Kelas Tambahan
                </label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm text-slate-800"
                >
                  <option value="">Pilih Kelas...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.namaKelas} (Rp {Number(c.harga).toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tanggal Kelas Tambahan
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      const [hours, minutes] = e.target.value.split(':');
                      const nextHour = (parseInt(hours) + 1).toString().padStart(2, '0');
                      setEndTime(`${nextHour}:${minutes}`);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Catatan Guru / Unit
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-sm text-slate-800"
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
                  Jadwalkan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
