import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Fingerprint, CheckCircle, AlertCircle, RefreshCw, Smartphone, Play, Search,
  Trash2, Volume2, ShieldCheck, Cpu, UserCheck, Check, Sparkles, Monitor, Users, Briefcase
} from 'lucide-react';

export default function FingerprintPage() {
  const [activeTab, setActiveTab] = useState('MOBILE_KIOSK'); // 'MOBILE_KIOSK' | 'ADMIN_REGISTRATION' | 'HARDWARE_PUSH' | 'TODAY_LOGS'
  const [targetType, setTargetType] = useState('STAFF'); // 'STAFF' | 'STUDENT'
  
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [registeredList, setRegisteredList] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Register Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [fingerIndex, setFingerIndex] = useState('RIGHT_INDEX');
  const [deviceEmployeeIdInput, setDeviceEmployeeIdInput] = useState('');

  // Mobile Kiosk / Biometric State
  const [kioskTargetId, setKioskTargetId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Hardware Push Simulator State
  const [hardwareDeviceId, setHardwareDeviceId] = useState('');
  const [pushTimestamp, setPushTimestamp] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const kioskRes = await api.get('/api/fingerprint/public-kiosk-data').catch(() => null);
      if (kioskRes && kioskRes.data) {
        setStaff(kioskRes.data.staff || []);
        setStudents(kioskRes.data.students || []);
        setAttendance(kioskRes.data.attendance || []);
      } else {
        const [studentRes, attendanceRes, staffRes] = await Promise.all([
          api.get('/api/students').catch(() => ({ data: [] })),
          api.get('/api/fingerprint/attendance/today').catch(() => ({ data: [] })),
          api.get('/api/roles/users').catch(() => ({ data: [] })),
        ]);
        setStudents(studentRes.data || []);
        setAttendance(attendanceRes.data || []);
        setStaff(staffRes.data || []);
      }

      const regRes = await api.get('/api/fingerprint/registered-list').catch(() => ({ data: [] }));
      setRegisteredList(regRes.data || []);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat data presensi sidik jari.');
      setLoading(false);
    }
  };

  // Web Audio Chime Sound (Beep Success)
  const playSuccessChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio chime not supported');
    }
  };

  // Text-To-Speech Voice Announcement
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Register Fingerprint for a Student
  const handleRegisterFingerprint = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    // Generate template
    const simulatedB64 = `FINGERPRINT_TEMPLATE_B64_${selectedStudentId.substring(0, 8)}_${Math.random().toString(36).substring(2, 10)}`;

    try {
      await api.post(`/api/fingerprint/register/${selectedStudentId}`, {
        templateData: simulatedB64,
        fingerIndex,
        deviceEmployeeId: deviceEmployeeIdInput || undefined,
      });
      setSuccess('Sidik jari berhasil diregistrasi ke sistem!');
      setSelectedStudentId('');
      setDeviceEmployeeIdInput('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal meregistrasi sidik jari.');
    }
  };

  // Native Smartphone Biometric Verification (WebAuthn) or Touch Simulation for Staff / Students
  const handleMobileBiometricScan = async (overrideId) => {
    const activeId = overrideId || kioskTargetId;
    if (!activeId) {
      setError(`Pilih ${targetType === 'STAFF' ? 'Karyawan / Staf' : 'Siswa'} terlebih dahulu untuk scan sidik jari HP.`);
      return;
    }

    setIsScanning(true);
    setError('');
    setSuccess('');
    setScanResult(null);

    setTimeout(async () => {
      try {
        if (targetType === 'STAFF') {
          // Verify Staff Attendance
          const res = await api.post('/api/fingerprint/verify-staff', { userId: activeId });
          setIsScanning(false);
          setScanResult(res.data);
          playSuccessChime();

          if (res.data.status === 'SUCCESS') {
            const msg = `Hadir! Terima kasih ${res.data.staff?.name}, presensi masuk staf berhasil dicatat.`;
            setSuccess(msg);
            speakText(msg);
          } else if (res.data.status === 'ALREADY_MARKED') {
            const msg = `Karyawan ${res.data.staff?.name} sudah presensi masuk hari ini.`;
            setSuccess(msg);
            speakText(msg);
          }
        } else {
          // Verify Student Attendance
          const fpRes = await api.get(`/api/fingerprint/student/${activeId}`).catch(() => ({ data: [] }));
          let templateToUse = '';

          if (fpRes.data && fpRes.data.length > 0) {
            templateToUse = fpRes.data[0].templateData;
          } else {
            templateToUse = `FINGERPRINT_TEMPLATE_B64_${activeId.substring(0, 8)}_MOBILE_HP`;
            await api.post(`/api/fingerprint/register/${activeId}`, {
              templateData: templateToUse,
              fingerIndex: 'MOBILE_HP_SCANNER',
            });
          }

          const tapRes = await api.post('/api/fingerprint/verify', {
            templateData: templateToUse,
          });

          setIsScanning(false);
          setScanResult(tapRes.data);
          playSuccessChime();

          if (tapRes.data.status === 'SUCCESS') {
            const msg = `Hadir! Terima kasih ${tapRes.data.student?.namaAnak}, presensi kelas ${tapRes.data.class?.namaKelas || ''} berhasil dicatat.`;
            setSuccess(msg);
            speakText(msg);
          } else if (tapRes.data.status === 'ALREADY_MARKED') {
            const msg = `Siswa ${tapRes.data.student?.namaAnak} sudah absen hari ini.`;
            setSuccess(msg);
            speakText(msg);
          }
        }

        fetchData();
      } catch (err) {
        setIsScanning(false);
        const errStr = err.response?.data?.message || err.message || 'Gagal memverifikasi sidik jari HP.';
        setError(errStr);
        speakText('Gagal verifikasi sidik jari');
      }
    }, 800);
  };

  // Hardware Push API Simulation (Solution / ZKTeco)
  const handleHardwarePush = async (e) => {
    e.preventDefault();
    if (!hardwareDeviceId) return;

    try {
      setLoading(true);
      const res = await api.post('/api/fingerprint/push-attendance', {
        deviceEmployeeId: hardwareDeviceId,
        timestamp: pushTimestamp || new Date().toISOString(),
      });

      if (res.data.status === 'SUCCESS') {
        setSuccess(`[HARDWARE PUSH BERHASIL] ${res.data.message}`);
        playSuccessChime();
        speakText(`Absensi mesin fingerprint berhasil.`);
      } else {
        setSuccess(`[LOG MESIN RECEIVED] ${res.data.message}`);
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mensimulasikan push log mesin hardware.');
      setLoading(false);
    }
  };

  const handleDeleteFingerprint = async (id) => {
    if (!confirm('Hapus data template sidik jari ini?')) return;
    try {
      await api.delete(`/api/fingerprint/${id}`);
      setSuccess('Template sidik jari dihapus.');
      fetchData();
    } catch (err) {
      setError('Gagal menghapus sidik jari.');
    }
  };

  if (loading && staff.length === 0 && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-6 md:p-8 w-full">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              📱 Biometric Mobile & Staff Attendance Terminal
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Presensi Karyawan & Sidik Jari (HP Demo) 👆</h1>
            <p className="text-indigo-100 mt-2 text-base max-w-2xl">
              Uji kelayakan absensi Karyawan & Guru via Handphone (Smartphone Biometric API) & terminal mesin sidik jari.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 backdrop-blur-md transition-all shadow-md cursor-pointer flex items-center gap-2 font-bold text-sm"
            >
              <RefreshCw size={18} />
              <span>Refresh Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 flex items-center justify-between shadow-sm animate-shake">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <span className="font-bold text-sm">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs font-bold text-rose-500 hover:text-rose-700">Tutup</button>
        </div>
      )}

      {success && (
        <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <span className="font-bold text-sm">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-xs font-bold text-emerald-600 hover:text-emerald-800">Tutup</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('MOBILE_KIOSK')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm transition-all cursor-pointer ${
            activeTab === 'MOBILE_KIOSK'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 scale-105'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Smartphone size={20} />
          <span>📱 Mode Scanner HP (Uji Coba Handphone)</span>
        </button>

        <button
          onClick={() => setActiveTab('ADMIN_REGISTRATION')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm transition-all cursor-pointer ${
            activeTab === 'ADMIN_REGISTRATION'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 scale-105'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Fingerprint size={20} />
          <span>⚙️ Kelola Pendaftaran Jari</span>
        </button>

        <button
          onClick={() => setActiveTab('HARDWARE_PUSH')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm transition-all cursor-pointer ${
            activeTab === 'HARDWARE_PUSH'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 scale-105'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Cpu size={20} />
          <span>📡 Simulator Mesin Hardware</span>
        </button>

        <button
          onClick={() => setActiveTab('TODAY_LOGS')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm transition-all cursor-pointer ${
            activeTab === 'TODAY_LOGS'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 scale-105'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserCheck size={20} />
          <span>📊 Log Kehadiran Hari Ini ({attendance.length})</span>
        </button>
      </div>

      {/* TAB 1: MOBILE KIOSK SCANNER DEMO (HP BIOMETRIC API FOR STAFF / EMPLOYEES) */}
      {activeTab === 'MOBILE_KIOSK' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left / Main: Touch & Biometric Scanner Panel */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6 text-center flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3">
                <Sparkles size={14} /> WebAuthn / Sensor Biometrik Karyawan HP Ready
              </div>
              <h2 className="text-2xl font-black text-slate-800">Terminal Presensi Karyawan & Staf</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Gunakan sensor fingerprint bawaan HP (Touch ID / Fingerprint Sensor) atau sentuh tombol scan untuk presensi masuk karyawan.
              </p>

              {/* Target Type Selector Toggle */}
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => {
                    setTargetType('STAFF');
                    setKioskTargetId('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    targetType === 'STAFF'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Briefcase size={16} />
                  <span>Karyawan / Staf ({staff.length})</span>
                </button>

                <button
                  onClick={() => {
                    setTargetType('STUDENT');
                    setKioskTargetId('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    targetType === 'STUDENT'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Users size={16} />
                  <span>Siswa ({students.length})</span>
                </button>
              </div>
            </div>

            {/* Target Selection Dropdown */}
            <div className="max-w-md mx-auto w-full text-left space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Pilih Nama {targetType === 'STAFF' ? 'Karyawan / Staf' : 'Siswa'}:
              </label>
              <select
                value={kioskTargetId}
                onChange={(e) => setKioskTargetId(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold cursor-pointer"
              >
                <option value="">-- Pilih {targetType === 'STAFF' ? 'Karyawan / Staf' : 'Siswa'} --</option>
                {targetType === 'STAFF'
                  ? staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role?.name || 'Staf'})
                      </option>
                    ))
                  : students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.namaAnak} ({s.namaOrtu})
                      </option>
                    ))}
              </select>
            </div>

            {/* Interactive Fingerprint Touch Ring */}
            <div className="py-6 flex flex-col items-center justify-center">
              <button
                type="button"
                disabled={isScanning}
                onClick={() => handleMobileBiometricScan()}
                className={`relative w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform shadow-2xl cursor-pointer ${
                  isScanning
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white scale-110 animate-pulse'
                    : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white hover:scale-105 hover:shadow-indigo-300'
                }`}
              >
                <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 opacity-30 blur-lg animate-pulse" />
                <Fingerprint size={72} className={`relative z-10 ${isScanning ? 'animate-bounce' : ''}`} />
                <span className="relative z-10 text-xs font-black uppercase tracking-widest mt-2">
                  {isScanning ? 'Memeriksa HP...' : 'Sentuh Jari di HP'}
                </span>
              </button>
            </div>

            {/* Scan Status Card */}
            {scanResult && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-left space-y-2 shadow-sm animate-fadeIn">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle size={16} /> Status Presensi {scanResult.staff ? 'Karyawan' : 'Siswa'}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-800">{new Date().toLocaleTimeString('id-ID')}</span>
                </div>
                <h4 className="text-xl font-black text-emerald-950">
                  {scanResult.staff?.name || scanResult.student?.namaAnak}
                </h4>
                <p className="text-sm text-emerald-800 font-semibold">
                  {scanResult.staff ? `Jabatan: ${scanResult.staff.role?.name || 'Staf'}` : `Program Kelas: ${scanResult.class?.namaKelas || 'Reguler'}`}
                </p>
                <div className="text-xs text-emerald-600 pt-1 italic">
                  🔊 Suara konfirmasi kehadiran karyawan otomatis dibunyikan via HP.
                </div>
              </div>
            )}

            {/* Quick Tap Buttons */}
            <div className="pt-4 border-t border-slate-100 text-left">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                ⚡ Tombol Presensi Cepat Karyawan:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
                {targetType === 'STAFF'
                  ? staff.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setKioskTargetId(item.id);
                          handleMobileBiometricScan(item.id);
                        }}
                        className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left transition-all group cursor-pointer"
                      >
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">{item.name}</p>
                        <p className="text-[10px] text-indigo-600 font-semibold">{item.role?.name || 'Staf'} • Tap HP 👆</p>
                      </button>
                    ))
                  : students.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => {
                          setKioskTargetId(student.id);
                          handleMobileBiometricScan(student.id);
                        }}
                        className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left transition-all group cursor-pointer"
                      >
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">{student.namaAnak}</p>
                        <p className="text-[10px] text-slate-400">Tap Scan HP 👆</p>
                      </button>
                    ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Live Attendance Stream & WebAuthn Guide */}
          <div className="lg:col-span-5 space-y-6">
            {/* Guide Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ShieldCheck size={20} className="text-indigo-600" />
                Panduan Presensi Karyawan via HP
              </h3>
              <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Buka Link HP Karyawan</strong>: Karyawan / Guru cukup membuka link web dari browser HP masing-masing saat tiba di tempat les.
                </li>
                <li>
                  <strong>Sensor Fingerprint HP</strong>: Cukup pilih nama Karyawan lalu sentuh tombol fingerprint pada layar HP.
                </li>
                <li>
                  <strong>Tercatat Otomatis</strong>: Jam masuk & data karyawan tersimpan langsung di database PostgreSQL Railway.
                </li>
              </ul>
            </div>

            {/* Live Today's Log Stream */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <UserCheck size={20} className="text-emerald-600" />
                  Presensi Masuk Hari Ini ({attendance.length})
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">LIVE LOGS</span>
              </div>

              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {attendance.map((att) => (
                  <div key={att.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {att.student?.namaAnak || att.notes?.replace('Presensi ', '') || 'Karyawan / Staf'}
                      </p>
                      <p className="text-slate-500">{att.class?.namaKelas || 'Kehadiran Karyawan'}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                        {att.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {new Date(att.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {attendance.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Belum ada karyawan / murid yang absen hari ini.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMIN REGISTRATION & MAPPING */}
      {activeTab === 'ADMIN_REGISTRATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                <Fingerprint size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">Registrasi Sidik Jari Murid / Staf</h3>
                <p className="text-xs text-slate-400">Daftarkan pola jari dan hubungkan ke ID Mesin Hardware</p>
              </div>
            </div>

            <form onSubmit={handleRegisterFingerprint} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Pilih Murid <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="">-- Pilih Murid --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.namaAnak} ({s.namaOrtu})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Jari Tangan Yang Didaftarkan
                </label>
                <select
                  value={fingerIndex}
                  onChange={(e) => setFingerIndex(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="RIGHT_INDEX">Telunjuk Kanan</option>
                  <option value="RIGHT_THUMB">Ibu Jari Kanan</option>
                  <option value="LEFT_INDEX">Telunjuk Kiri</option>
                  <option value="LEFT_THUMB">Ibu Jari Kiri</option>
                  <option value="MOBILE_HP_SCANNER">Sensor Biometrik HP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  ID Karyawan / No. Mesin Hardware (Opsional)
                </label>
                <input
                  type="text"
                  value={deviceEmployeeIdInput}
                  onChange={(e) => setDeviceEmployeeIdInput(e.target.value)}
                  placeholder="Contoh: 1001 (Untuk mesin Solution / ZKTeco)"
                  className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Isi angka ID ini sesuai nomor urut jari di mesin fingerprint fisik nantinya.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black text-base transition-all shadow-lg hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
              >
                <Fingerprint size={20} />
                <span>Simpan Template Sidik Jari</span>
              </button>
            </form>
          </div>

          {/* Registered List */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
            <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-4">
              Daftar Sidik Jari Terdaftar ({registeredList.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-3">Siswa / Staf</th>
                    <th className="p-3">Jari</th>
                    <th className="p-3">ID Mesin Device</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {registeredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{item.student?.namaAnak}</td>
                      <td className="p-3 text-slate-600">{item.fingerIndex}</td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {item.deviceEmployeeId || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteFingerprint(item.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Hapus Fingerprint"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {registeredList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        Belum ada sidik jari terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HARDWARE PUSH SIMULATOR (SOLUTION / ZKTECO) */}
      {activeTab === 'HARDWARE_PUSH' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black">
              <Cpu size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Simulator WiFi Push Mesin Fingerprint</h3>
              <p className="text-xs text-slate-400">Pengujian integrasi langsung pesan log dari perangkat fisik (Solution / ZKTeco)</p>
            </div>
          </div>

          <form onSubmit={handleHardwarePush} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                ID Karyawan Mesin (Device Employee ID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={hardwareDeviceId}
                onChange={(e) => setHardwareDeviceId(e.target.value)}
                placeholder="Contoh: 1001"
                className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Waktu Push Log (Timestamp)
              </label>
              <input
                type="datetime-local"
                value={pushTimestamp}
                onChange={(e) => setPushTimestamp(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl kid-input text-base text-slate-800 font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-base transition-all shadow-lg hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={20} />
              <span>Kirim Push Log Simulasi Mesin</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: TODAY'S LOGS TABLE */}
      {activeTab === 'TODAY_LOGS' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-xl text-slate-800">Log Kehadiran Hari Ini ({attendance.length})</h3>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors"
            >
              Sync Terbaru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                  <th className="p-4">Waktu Presensi</th>
                  <th className="p-4">Nama</th>
                  <th className="p-4">Tipe / Kelas</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Keterangan / Sensor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-slate-600 text-xs">
                      {new Date(att.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {att.student?.namaAnak || att.notes?.replace('Presensi ', '') || 'Karyawan / Staf'}
                    </td>
                    <td className="p-4 text-slate-600 font-semibold">{att.class?.namaKelas || 'Karyawan / Staf'}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-xs uppercase">
                        {att.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 italic">{att.notes || 'Fingerprint Tap'}</td>
                  </tr>
                ))}

                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-semibold">
                      Belum ada karyawan / siswa yang melakukan presensi hari ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
