import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Calendar, Users, PlusCircle, Trash2, BookOpen, AlertCircle, Clock } from 'lucide-react';

export default function HolidayClassPage() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClass, setNewClass] = useState({
    namaProgram: '',
    deskripsi: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    harga: '',
    maxCapacity: 15,
  });

  // Enroll state
  const [selectedClass, setSelectedClass] = useState(null);
  const [studentIdToEnroll, setStudentIdToEnroll] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Schedule state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    date: '',
    startTime: '',
    endTime: '',
    topic: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, studentRes] = await Promise.all([
        api.get('/api/holiday-class'),
        api.get('/api/students?limit=1000'),
      ]);
      setClasses(classRes.data);
      setStudents(studentRes.data.data || []);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat data');
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/holiday-class', {
        ...newClass,
        harga: Number(newClass.harga),
        maxCapacity: Number(newClass.maxCapacity),
        tanggalMulai: new Date(newClass.tanggalMulai).toISOString(),
        tanggalSelesai: new Date(newClass.tanggalSelesai).toISOString(),
      });
      setSuccess('Holiday Class berhasil dibuat!');
      setShowAddModal(false);
      setNewClass({ namaProgram: '', deskripsi: '', tanggalMulai: '', tanggalSelesai: '', harga: '', maxCapacity: 15 });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat Holiday Class');
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus program ini?')) return;
    try {
      await api.delete(`/api/holiday-class/${id}`);
      setSuccess('Holiday Class berhasil dihapus');
      fetchData();
    } catch (err) {
      setError('Gagal menghapus program');
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!studentIdToEnroll) return;
    try {
      await api.post(`/api/holiday-class/${selectedClass.id}/enroll`, {
        studentId: studentIdToEnroll,
      });
      setSuccess('Murid berhasil didaftarkan ke kelas!');
      setShowEnrollModal(false);
      setStudentIdToEnroll('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mendaftarkan murid');
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/holiday-class/${selectedClass.id}/schedule`, {
        ...newSchedule,
        date: new Date(newSchedule.date).toISOString(),
      });
      setSuccess('Jadwal kelas berhasil ditambahkan');
      setShowScheduleModal(false);
      setNewSchedule({ date: '', startTime: '', endTime: '', topic: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan jadwal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Program Holiday Class</h1>
          <p className="text-sm text-slate-500">Kelola kelas liburan khusus siswa, pendaftaran, dan jadwal kegiatan.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-colors text-sm"
        >
          <PlusCircle size={18} />
          Tambah Program
        </button>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-150">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-150">
          <Clock size={18} />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-wider">
                      {cls.status}
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg leading-snug">{cls.namaProgram}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteClass(cls.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <p className="text-slate-500 text-sm line-clamp-3">{cls.deskripsi || 'Tidak ada deskripsi.'}</p>

                <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span>
                      {new Date(cls.tanggalMulai).toLocaleDateString('id-ID')} - {new Date(cls.tanggalSelesai).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span>
                      {cls.enrollments?.length || 0} / {cls.maxCapacity} Terdaftar
                    </span>
                  </div>
                </div>

                <div className="text-lg font-bold text-indigo-600">
                  Rp {Number(cls.harga).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedClass(cls);
                    setShowEnrollModal(true);
                  }}
                  className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl text-center transition-colors"
                >
                  Daftarkan Murid
                </button>
                <button
                  onClick={() => {
                    setSelectedClass(cls);
                    setShowScheduleModal(true);
                  }}
                  className="flex-1 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-semibold rounded-xl text-center transition-colors"
                >
                  Kelola Jadwal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateClass} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Buat Program Holiday Class</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Program</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Camp Drawing"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  value={newClass.namaProgram}
                  onChange={(e) => setNewClass({ ...newClass, namaProgram: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Deskripsi</label>
                <textarea
                  placeholder="Deskripsi kegiatan..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm h-20"
                  value={newClass.deskripsi}
                  onChange={(e) => setNewClass({ ...newClass, deskripsi: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={newClass.tanggalMulai}
                    onChange={(e) => setNewClass({ ...newClass, tanggalMulai: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={newClass.tanggalSelesai}
                    onChange={(e) => setNewClass({ ...newClass, tanggalSelesai: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Harga Program (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={newClass.harga}
                    onChange={(e) => setNewClass({ ...newClass, harga: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kapasitas Maks</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={newClass.maxCapacity}
                    onChange={(e) => setNewClass({ ...newClass, maxCapacity: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Simpan Program
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEnrollStudent} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Daftarkan Murid ke {selectedClass?.namaProgram}</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Murid</label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                value={studentIdToEnroll}
                onChange={(e) => setStudentIdToEnroll(e.target.value)}
              >
                <option value="">-- Pilih Murid --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.namaAnak} ({student.namaOrtu})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Daftarkan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Management Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Kelola Jadwal: {selectedClass?.namaProgram}</h3>

            {/* List existing schedules */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-500">Jadwal Sesi Terdaftar:</h4>
              {selectedClass?.schedules?.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada sesi terjadwal.</p>
              ) : (
                selectedClass?.schedules?.map((sch) => (
                  <div key={sch.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{new Date(sch.date).toLocaleDateString('id-ID')}</p>
                      <p className="text-slate-500">{sch.startTime} - {sch.endTime} | {sch.topic || 'No topic'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form to add schedule */}
            <form onSubmit={handleCreateSchedule} className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-indigo-600">Tambah Sesi Baru</h4>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Sesi</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jam Mulai</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jam Selesai</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12:00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Topik Sesi (Opsional)</label>
                <input
                  type="text"
                  placeholder="e.g. Teknik Gradasi Warna"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  value={newSchedule.topic}
                  onChange={(e) => setNewSchedule({ ...newSchedule, topic: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Tambah Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
