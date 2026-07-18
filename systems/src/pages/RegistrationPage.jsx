import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function RegistrationPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successData, setSuccessData] = useState(null);

  // Form Fields
  const [studentInfo, setStudentInfo] = useState({
    namaAnak: '',
    umur: '',
    namaOrtu: '',
    noHpOrtu: '',
    emailOrtu: '',
    instagram: '',
    alamat: '',
  });

  // Selected class schedules
  const [selectedSchedules, setSelectedSchedules] = useState([
    { classId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }
  ]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/api/classes');
        setClasses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching classes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleStudentChange = (e) => {
    setStudentInfo({ ...studentInfo, [e.target.name]: e.target.value });
  };

  const handleScheduleChange = (index, field, value) => {
    const updated = [...selectedSchedules];
    updated[index][field] = field === 'dayOfWeek' ? parseInt(value) : value;

    // Auto end-time calculation (add 1 hour as default)
    if (field === 'startTime') {
      const [hours, minutes] = value.split(':');
      const nextHour = (parseInt(hours) + 1).toString().padStart(2, '0');
      updated[index].endTime = `${nextHour}:${minutes}`;
    }

    setSelectedSchedules(updated);
  };

  const addScheduleField = () => {
    setSelectedSchedules([
      ...selectedSchedules,
      { classId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }
    ]);
  };

  const removeScheduleField = (index) => {
    const updated = selectedSchedules.filter((_, i) => i !== index);
    setSelectedSchedules(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any schedule classId is empty
    if (selectedSchedules.some(s => !s.classId)) {
      alert('Pilih kelas terlebih dahulu untuk semua jadwal');
      return;
    }

    const payload = {
      ...studentInfo,
      umur: parseInt(studentInfo.umur),
      schedules: selectedSchedules,
    };

    try {
      const res = await api.post('/api/registration', payload);
      setSuccessData(res.data);
      // Reset forms
      setStudentInfo({
        namaAnak: '',
        umur: '',
        namaOrtu: '',
        noHpOrtu: '',
        emailOrtu: '',
        instagram: '',
        alamat: '',
      });
      setSelectedSchedules([{ classId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }]);
    } catch (err) {
      alert('Registrasi Gagal: ' + (err.response?.data?.message || err.message));
    }
  };

  const days = [
    { value: 0, label: 'Minggu' },
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 md:p-8 w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Registrasi Siswa Baru</h1>
        <p className="text-slate-500 mt-2 text-base md:text-lg">Daftarkan anak dan tentukan kelas serta jadwal belajarnya</p>
      </div>

      {successData && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start space-x-4">
          <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-800">Registrasi Berhasil!</h3>
            <p className="text-sm text-emerald-600 mt-1">
              Siswa <strong>{successData.student.namaAnak}</strong> telah terdaftar.
            </p>
            <div className="mt-4 p-4 rounded-xl bg-white border border-emerald-100 space-y-2 text-sm text-slate-700">
              <div><strong>ID Siswa:</strong> {successData.student.id}</div>
              <div>
                <strong>Tagihan Registrasi:</strong> Rp {Number(successData.payment.amount).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-slate-400">
                Gunakan invoice ini pada menu Pembayaran untuk melakukan pelunasan.
              </div>
            </div>
            <button
              onClick={() => setSuccessData(null)}
              className="mt-4 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
            >
              Registrasi Baru
            </button>
          </div>
        </div>
      )}

      {!successData && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Student & Parent Info */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">
              1. Informasi Siswa & Orang Tua
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Lengkap Anak
                </label>
                <input
                  type="text"
                  required
                  name="namaAnak"
                  value={studentInfo.namaAnak}
                  onChange={handleStudentChange}
                  placeholder="Nama anak..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Umur Anak
                </label>
                <input
                  type="number"
                  required
                  name="umur"
                  value={studentInfo.umur}
                  onChange={handleStudentChange}
                  placeholder="Umur..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-base font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Orang Tua / Wali
                </label>
                <input
                  type="text"
                  required
                  name="namaOrtu"
                  value={studentInfo.namaOrtu}
                  onChange={handleStudentChange}
                  placeholder="Nama orang tua..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-slate-700 uppercase tracking-wider mb-2">
                  No. Handphone (WhatsApp)
                </label>
                <input
                  type="text"
                  required
                  name="noHpOrtu"
                  value={studentInfo.noHpOrtu}
                  onChange={handleStudentChange}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Orang Tua
                </label>
                <input
                  type="email"
                  required
                  name="emailOrtu"
                  value={studentInfo.emailOrtu}
                  onChange={handleStudentChange}
                  placeholder="Contoh: orangtua@gmail.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Instagram (Opsional)
                </label>
                <input
                  type="text"
                  name="instagram"
                  value={studentInfo.instagram}
                  onChange={handleStudentChange}
                  placeholder="@username"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Alamat Rumah (Opsional)
                </label>
                <input
                  type="text"
                  name="alamat"
                  value={studentInfo.alamat}
                  onChange={handleStudentChange}
                  placeholder="Alamat rumah..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Class Schedules Enrollment */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">
                2. Pemilihan Kelas & Jadwal Rencana
              </h2>
              <button
                type="button"
                onClick={addScheduleField}
                className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Tambah Kelas</span>
              </button>
            </div>

            <div className="space-y-5">
              {selectedSchedules.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-5 p-5 rounded-xl border border-slate-100 bg-slate-50/50 relative">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Kelas Yang Dipilih
                    </label>
                    <select
                      required
                      value={item.classId}
                      onChange={(e) => handleScheduleChange(index, 'classId', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm cursor-pointer"
                    >
                      <option value="">Pilih Kelas...</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {/* Sesuaikan c.name atau c.namaKelas dengan respon backend Anda */}
                          {c.name || c.namaKelas} (Rp {Number(c.price || c.harga || 0).toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Hari Belajar
                    </label>
                    <select
                      value={item.dayOfWeek}
                      onChange={(e) => handleScheduleChange(index, 'dayOfWeek', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm cursor-pointer"
                    >
                      {days.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      required
                      value={item.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                    />
                  </div>

                  <div className="flex items-end justify-between space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Jam Selesai
                      </label>
                      <input
                        type="time"
                        required
                        value={item.endTime}
                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                      />
                    </div>

                    {selectedSchedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScheduleField(index)}
                        className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-xl border border-slate-100 hover:border-red-100 hover:shadow-sm transition-all"
                        title="Hapus Kelas"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-2">
            <button
              type="submit"
              disabled={loading || classes.length === 0}
              className={`px-8 py-3.5 text-base font-bold rounded-xl transition-all ${classes.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                } text-white shadow-md shadow-indigo-100`}
            >
              {classes.length === 0 ? 'Memuat Kelas...' : 'Proses Registrasi Siswa'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
