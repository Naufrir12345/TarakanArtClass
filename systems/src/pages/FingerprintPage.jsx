import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Fingerprint, CheckCircle, AlertCircle, RefreshCw, Smartphone, Play, Search, Trash2 } from 'lucide-react';

export default function FingerprintPage() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Register state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [fingerIndex, setFingerIndex] = useState('RIGHT_INDEX');
  
  // Verification simulator
  const [simulatedTemplate, setSimulatedTemplate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentRes, attendanceRes] = await Promise.all([
        api.get('/api/students'),
        api.get('/api/fingerprint/attendance/today'),
      ]);
      setStudents(studentRes.data);
      setAttendance(attendanceRes.data);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat data fingerprint.');
      setLoading(false);
    }
  };

  const handleRegisterFingerprint = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    // Generate a random simulated base64 fingerprint biometric template
    const simulatedB64 = `FINGERPRINT_TEMPLATE_B64_${selectedStudentId.substring(0, 8)}_${Math.random().toString(36).substring(2, 10)}`;

    try {
      await api.post(`/api/fingerprint/register/${selectedStudentId}`, {
        templateData: simulatedB64,
        fingerIndex,
      });
      setSuccess('Sidik jari berhasil diregistrasi ke sistem!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal meregistrasi sidik jari.');
    }
  };

  const handleSimulateScan = async (studentId) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    // We fetch registered fingerprints for this student first to simulate tap
    try {
      setSuccess(`Menghubungkan ke Scanner... Silakan letakkan jari murid [${student.namaAnak}]`);
      const fpRes = await api.get(`/api/fingerprint/student/${studentId}`);
      const fingerprints = fpRes.data;

      if (fingerprints.length === 0) {
        throw new Error('Siswa ini belum meregistrasikan sidik jarinya.');
      }

      // Tap scanner with the registered template
      const tapRes = await api.post('/api/fingerprint/verify', {
        templateData: fingerprints[0].templateData,
      });

      if (tapRes.data.status === 'SUCCESS') {
        setSuccess(`[ABSEN BERHASIL] ${tapRes.data.message}`);
      } else if (tapRes.data.status === 'ALREADY_MARKED') {
        setSuccess(`[SUDAH ABSEN] ${tapRes.data.message}`);
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gagal memverifikasi sidik jari.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Presensi Sidik Jari (Fingerprint)</h1>
          <p className="text-sm text-slate-500">Kelola pendaftaran sidik jari murid dan simulasi presensi real-time hardware terminal.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-150">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-150">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Register Fingerprint */}
        <div className="space-y-6 lg:col-span-1">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Fingerprint size={18} className="text-indigo-650" />
              Pendaftaran Sidik Jari
            </h3>
            
            <form onSubmit={handleRegisterFingerprint} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Murid</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">-- Pilih Murid --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.namaAnak}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Jari Tangan</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  value={fingerIndex}
                  onChange={(e) => setFingerIndex(e.target.value)}
                >
                  <option value="RIGHT_INDEX">Telunjuk Kanan</option>
                  <option value="RIGHT_THUMB">Ibu Jari Kanan</option>
                  <option value="LEFT_INDEX">Telunjuk Kiri</option>
                  <option value="LEFT_THUMB">Ibu Jari Kiri</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Fingerprint size={16} />
                Daftarkan & Generate Template
              </button>
            </form>
          </div>

          {/* Biometric Scan Simulator Terminal */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Smartphone size={18} className="text-indigo-600" />
              Terminal Scan Simulator
            </h3>
            <p className="text-xs text-slate-500">Klik tombol scan di bawah untuk mensimulasikan penempelan jari anak pada mesin fingerprint.</p>
            
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {students.map((student) => (
                <div key={student.id} className="flex justify-between items-center bg-slate-50 p-2 border border-slate-100 rounded-xl">
                  <div className="text-xs">
                    <p className="font-bold text-slate-850">{student.namaAnak}</p>
                    <p className="text-[10px] text-slate-400">Ortu: {student.namaOrtu}</p>
                  </div>
                  <button
                    onClick={() => handleSimulateScan(student.id)}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Play size={12} />
                    Scan
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Attendance Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Kehadiran Hari Ini (Fingerprint Logs)</h3>
              <p className="text-xs text-slate-400">Daftar kehadiran siswa yang ter-record otomatis hari ini.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Waktu Log</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Nama Siswa</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Kelas Reguler</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status Kehadiran</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Metode</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((att) => (
                    <tr key={att.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(att.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-800">
                        {att.student?.namaAnak}
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-600">
                        {att.class?.namaKelas || 'Holiday Class'}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full uppercase">
                          {att.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400 italic">
                        {att.notes || 'Fingerprint Tap'}
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                        Belum ada presensi sidik jari hari ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
