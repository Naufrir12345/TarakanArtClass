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
    <div className="max-w-[1600px] mx-auto space-y-8 p-6 md:p-8 w-full">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              ✨ Modul Pendaftaran Siswa
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Registrasi Siswa Baru 🎨</h1>
            <p className="text-indigo-100 mt-2 text-base md:text-lg max-w-2xl">
              Daftarkan anak dan pilih kelas serta jadwal les belajar kreatif dengan mudah
            </p>
          </div>
        </div>
      </div>

      {successData && (
        <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-xl flex items-start space-x-5">
          <div className="p-3 rounded-2xl bg-emerald-500 text-white shrink-0 shadow-lg shadow-emerald-200">
            <CheckCircle2 size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black text-emerald-900">Registrasi Berhasil! 🎉</h3>
            <p className="text-base text-emerald-700 mt-1">
              Siswa <strong>{successData.student.namaAnak}</strong> telah berhasil didaftarkan ke sistem les.
            </p>
            <div className="mt-5 p-6 rounded-2xl bg-white border border-emerald-100 shadow-sm space-y-3 text-base text-slate-700">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">ID Siswa:</span>
                <span className="font-mono font-bold text-indigo-600">{successData.student.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Total Tagihan Pendaftaran:</span>
                <span className="text-xl font-black text-emerald-600">
                  Rp {Number(successData.payment.amount).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-xs text-slate-400 italic pt-1">
                📌 Catatan: Tagihan ini telah otomatis tersimpan di modul Pembayaran. Jika pembayaran dibatalkan (Cancel), data pendaftaran siswa baru akan dibersihkan otomatis.
              </div>
            </div>
            <button
              onClick={() => setSuccessData(null)}
              className="mt-6 px-6 py-3 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-md hover:scale-105"
            >
              + Registrasi Siswa Lain
            </button>
          </div>
        </div>
      )}

      {!successData && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Student & Parent Info */}
          <div className="kid-card rounded-3xl p-8 space-y-6 border border-slate-200/80 shadow-md">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg">
                1
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Informasi Siswa & Orang Tua</h2>
                <p className="text-xs text-slate-400">Lengkapi identitas anak dan kontak wali murid</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Nama Lengkap Anak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="namaAnak"
                  value={studentInfo.namaAnak}
                  onChange={handleStudentChange}
                  placeholder="Contoh: Budi Pratama"
                  className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Umur Anak (Tahun) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  name="umur"
                  value={studentInfo.umur}
                  onChange={handleStudentChange}
                  placeholder="Contoh: 7"
                  className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="namaOrtu"
                  value={studentInfo.namaOrtu}
                  onChange={handleStudentChange}
                  placeholder="Contoh: Ibu Rina"
                  className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  No. Handphone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="noHpOrtu"
                  value={studentInfo.noHpOrtu}
                  onChange={handleStudentChange}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Email Orang Tua <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  name="emailOrtu"
                  value={studentInfo.emailOrtu}
                  onChange={handleStudentChange}
                  placeholder="orangtua@gmail.com"
                  className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Instagram Orang Tua (Opsional)
                </label>
                <input
                  type="text"
                  name="instagram"
                  value={studentInfo.instagram}
                  onChange={handleStudentChange}
                  placeholder="@username"
                  className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Alamat Rumah (Opsional)
                </label>
                <input
                  type="text"
                  name="alamat"
                  value={studentInfo.alamat}
                  onChange={handleStudentChange}
                  placeholder="Jl. Mawar No. 123..."
                  className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Class Schedules Enrollment */}
          <div className="kid-card rounded-3xl p-8 space-y-6 border border-slate-200/80 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-lg">
                  2
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Pemilihan Kelas & Jadwal Belajar</h2>
                  <p className="text-xs text-slate-400">Pilih program les dan tentukan hari serta jam les anak</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addScheduleField}
                className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-sm font-black transition-all shadow-md hover:scale-105 cursor-pointer"
              >
                <Plus size={18} />
                <span>+ Tambah Kelas</span>
              </button>
            </div>

            <div className="space-y-5">
              {selectedSchedules.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-5 p-6 rounded-2xl border-2 border-indigo-100/70 bg-gradient-to-br from-indigo-50/30 to-purple-50/20 relative kid-card">
                  <div>
                    <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                      Kelas Yang Dipilih
                    </label>
                    <select
                      required
                      value={item.classId}
                      onChange={(e) => handleScheduleChange(index, 'classId', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold cursor-pointer"
                    >
                      <option value="">Pilih Kelas Les...</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.namaKelas || c.name} (Rp {Number(c.harga || c.price || 0).toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                      Hari Belajar
                    </label>
                    <select
                      value={item.dayOfWeek}
                      onChange={(e) => handleScheduleChange(index, 'dayOfWeek', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold cursor-pointer"
                    >
                      {days.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      required
                      value={item.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
                    />
                  </div>

                  <div className="flex items-end justify-between space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                        Jam Selesai
                      </label>
                      <input
                        type="time"
                        required
                        value={item.endTime}
                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
                      />
                    </div>

                    {selectedSchedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScheduleField(index)}
                        className="p-3 bg-white text-rose-400 hover:text-rose-600 rounded-2xl border border-rose-100 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm"
                        title="Hapus Baris Kelas"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading || classes.length === 0}
              className={`px-10 py-4 text-lg font-black rounded-2xl transition-all shadow-xl ${
                classes.length === 0 ? 'bg-gray-400 cursor-not-allowed text-white' : 'kid-button-primary text-white cursor-pointer'
              }`}
            >
              {classes.length === 0 ? 'Memuat Data Kelas...' : '🚀 Proses Pendaftaran Siswa Baru'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
