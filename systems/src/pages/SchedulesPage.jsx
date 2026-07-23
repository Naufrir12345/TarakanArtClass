import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import {
  Calendar as CalendarIcon, ArrowRightLeft, Check, X, RefreshCw,
  ChevronLeft, ChevronRight, Clock, Edit3, Users, Trash2, PlusCircle, Save
} from 'lucide-react';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [replacements, setReplacements] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Hover tooltip state
  const [hoveredCell, setHoveredCell] = useState(null);

  // Day Detail Modal (klik tanggal)
  const [dayDetailModal, setDayDetailModal] = useState(null); // { date, dateStr, daySchedules[] }
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editForm, setEditForm] = useState({ studentId: '', classId: '', startTime: '', endTime: '' });

  // Add Schedule Sub-form State
  const [newScheduleOpen, setNewScheduleOpen] = useState(false);
  const [newScheduleForm, setNewScheduleForm] = useState({
    studentId: '',
    classId: '',
    startTime: '09:00',
    endTime: '10:00',
  });

  // Replacement Request Form State
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [originalDate, setOriginalDate] = useState('');
  const [reason, setReason] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualEndTime, setManualEndTime] = useState('10:00');

  const fetchData = async (dateParam = currentDate) => {
    setLoading(true);
    const m = dateParam.getMonth() + 1;
    const y = dateParam.getFullYear();
    try {
      const [schedulesRes, replacementsRes, studentsRes, classesRes] = await Promise.all([
        api.get(`/api/schedules?month=${m}&year=${y}`),
        api.get('/api/schedules/replacements'),
        api.get('/api/students?limit=1000'),
        api.get('/api/classes'),
      ]);
      setSchedules(schedulesRes.data);
      setReplacements(replacementsRes.data);
      setStudents(studentsRes.data.data || []);
      setClasses(classesRes.data || []);
      return { schedules: schedulesRes.data };
    } catch (err) {
      console.error('Error fetching schedules data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate]);

  const handleCopyFromPreviousMonth = async () => {
    const targetMonth = currentDate.getMonth() + 1;
    const targetYear = currentDate.getFullYear();
    
    // Calculate source month & year
    let sourceMonth = targetMonth - 1;
    let sourceYear = targetYear;
    if (sourceMonth === 0) {
      sourceMonth = 12;
      sourceYear = targetYear - 1;
    }

    const prevMonthName = monthsLabel[sourceMonth - 1];
    const currMonthName = monthsLabel[targetMonth - 1];

    if (confirm(`Apakah Anda ingin menyalin seluruh jadwal les dari bulan ${prevMonthName} ${sourceYear} ke bulan ${currMonthName} ${targetYear}?`)) {
      try {
        setLoading(true);
        const res = await api.post('/api/schedules/copy-month', {
          sourceMonth,
          sourceYear,
          targetMonth,
          targetYear,
        });
        alert(`✅ ${res.data.message}`);
        fetchData(currentDate);
      } catch (err) {
        alert('Gagal menyalin jadwal: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    }
  };

  const handleOpenReplaceModal = async (schedule, dateStr = '') => {
    setSelectedSchedule(schedule);
    setOriginalDate(dateStr || new Date().toISOString().split('T')[0]);
    setReason('');
    setRecommendations([]);
    setReplaceModalOpen(true);
    setDayDetailModal(null);
    setManualDate('');
    setManualStartTime(schedule.startTime || '09:00');
    setManualEndTime(schedule.endTime || '10:00');
    setLoadingRecommendations(true);
    try {
      const res = await api.get(`/api/schedules/recommendations/${schedule.id}`);
      setRecommendations(res.data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleCloseReplaceModal = () => {
    setReplaceModalOpen(false);
    setSelectedSchedule(null);
    setRecommendations([]);
  };

  const handleCreateReplacement = async (recommendedSlot = null) => {
    try {
      const payload = { scheduleId: selectedSchedule.id, originalDate, reason };
      if (recommendedSlot) {
        payload.replacementDate = recommendedSlot.date;
        payload.newDayOfWeek = recommendedSlot.dayOfWeek;
        payload.newStartTime = recommendedSlot.startTime;
        payload.newEndTime = recommendedSlot.endTime;
      } else if (manualDate) {
        const dateObj = new Date(manualDate);
        payload.replacementDate = dateObj.toISOString();
        payload.newDayOfWeek = dateObj.getDay();
        payload.newStartTime = manualStartTime;
        payload.newEndTime = manualEndTime;
      }
      await api.post('/api/schedules/replacements', payload);
      alert('Reschedule / Replacement request berhasil dikirim ke orang tua');
      fetchData();
      handleCloseReplaceModal();
    } catch (err) {
      alert('Gagal membuat replacement: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRespondReplacement = async (id, response) => {
    try {
      await api.post(`/api/schedules/replacements/${id}/respond`, { response });
      alert(`Status request berhasil diperbarui menjadi ${response}`);
      fetchData();
    } catch (err) {
      alert('Gagal memproses response');
    }
  };

  // Buka modal detail hari
  const handleOpenDayDetail = (cell, todaysSchedules, e) => {
    if (!cell.isCurrentMonth) return;
    setDayDetailModal({ date: cell.date, dateStr: cell.date.toISOString().split('T')[0], daySchedules: todaysSchedules });
    setEditingSchedule(null);
    setNewScheduleOpen(false);
    setNewScheduleForm({ studentId: '', classId: '', startTime: '09:00', endTime: '10:00' });
  };

  // Mulai edit jadwal
  const handleStartEdit = (schedule) => {
    setEditingSchedule(schedule.id);
    setEditForm({
      studentId: schedule.studentId,
      classId: schedule.classId,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
  };

  // Simpan perubahan jadwal
  const handleSaveEdit = async (scheduleId) => {
    if (!editForm.studentId || !editForm.classId || !editForm.startTime || !editForm.endTime) {
      alert('Mohon lengkapi semua kolom.');
      return;
    }
    try {
      await api.patch(`/api/schedules/${scheduleId}`, {
        studentId: editForm.studentId,
        classId: editForm.classId,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
      });
      alert('Jadwal berhasil diperbarui!');
      const data = await fetchData();
      if (data && dayDetailModal) {
        const day = dayDetailModal.date.getDay();
        const updated = data.schedules.filter(s => s.dayOfWeek === day && s.status === 'ACTIVE');
        setDayDetailModal(prev => ({ ...prev, daySchedules: updated }));
      }
      setEditingSchedule(null);
    } catch (err) {
      alert('Gagal memperbarui jadwal: ' + (err.response?.data?.message || err.message));
    }
  };

  // Hapus jadwal permanen
  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus jadwal ini secara permanen?')) return;
    try {
      await api.delete(`/api/schedules/${scheduleId}`);
      alert('Jadwal berhasil dihapus!');
      const data = await fetchData();
      if (data && dayDetailModal) {
        const day = dayDetailModal.date.getDay();
        const updated = data.schedules.filter(s => s.dayOfWeek === day && s.status === 'ACTIVE');
        setDayDetailModal(prev => ({ ...prev, daySchedules: updated }));
      }
    } catch (err) {
      alert('Gagal menghapus jadwal: ' + (err.response?.data?.message || err.message));
    }
  };

  // Tambah jadwal baru
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!newScheduleForm.studentId || !newScheduleForm.classId || !newScheduleForm.startTime || !newScheduleForm.endTime) {
      alert('Mohon lengkapi semua kolom.');
      return;
    }
    try {
      await api.post('/api/schedules', {
        studentId: newScheduleForm.studentId,
        classId: newScheduleForm.classId,
        startTime: newScheduleForm.startTime,
        endTime: newScheduleForm.endTime,
        dayOfWeek: dayDetailModal.date.getDay(),
        activeMonth: currentDate.getMonth() + 1,
        activeYear: currentDate.getFullYear(),
      });
      alert('Jadwal berhasil ditambahkan!');
      setNewScheduleForm({ studentId: '', classId: '', startTime: '09:00', endTime: '10:00' });
      setNewScheduleOpen(false);
      const data = await fetchData(currentDate);
      if (data && dayDetailModal) {
        const day = dayDetailModal.date.getDay();
        const updated = data.schedules.filter(s => s.dayOfWeek === day && s.status === 'ACTIVE');
        setDayDetailModal(prev => ({ ...prev, daySchedules: updated }));
      }
    } catch (err) {
      alert('Gagal menambah jadwal: ' + (err.response?.data?.message || err.message));
    }
  };

  const daysLabel = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const daysLabelFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthsLabel = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const getClassColor = (classType = '', className = '') => {
    const combined = `${classType} ${className}`.toLowerCase();
    if (combined.includes('gambar') || combined.includes('lukis')) return 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/70';
    if (combined.includes('main') || combined.includes('play')) return 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/70';
    if (combined.includes('inggris') || combined.includes('english') || combined.includes('bahasa')) return 'bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100/70';
    return 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100/70';
  };

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const totalDaysPrev = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ dayNum: totalDaysPrev - i, isCurrentMonth: false, date: new Date(year, month - 1, totalDaysPrev - i) });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ dayNum: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ dayNum: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  const inputCls = 'w-full px-4 py-2.5 rounded-2xl kid-input text-sm text-slate-800 font-semibold';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              🗓️ Perencanaan & Penyusunan Jadwal Bulanan
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Jadwal & Auto Replacement ⏰</h1>
            <p className="text-blue-100 mt-2 text-base md:text-lg max-w-2xl">
              Atur jadwal les anak per bulan. Admin dapat menyalin jadwal bulan lalu ke bulan baru dengan 1-klik!
            </p>
          </div>
          <button onClick={() => fetchData(currentDate)} className="p-3.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl transition-all shadow-md hover:scale-105 cursor-pointer self-start sm:self-center flex items-center gap-2 font-bold text-sm" title="Refresh Data">
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Kalender Bulanan */}
        <div className="lg:col-span-2 kid-card border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <CalendarIcon size={24} className="text-indigo-600" />
              <span>Kalender Les ({monthsLabel[currentDate.getMonth()]} {currentDate.getFullYear()})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopyFromPreviousMonth}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black transition-all shadow-md hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                title="Salin semua jadwal dari bulan sebelumnya"
              >
                <span>📋 Salin dari Bulan Lalu</span>
              </button>
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white rounded-xl text-slate-600 transition-all cursor-pointer"><ChevronLeft size={18} /></button>
                <span className="text-xs font-black text-slate-700 min-w-[110px] text-center">{monthsLabel[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-white rounded-xl text-slate-600 transition-all cursor-pointer"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>

          {schedules.length === 0 && !loading && (
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-bold text-sm">Jadwal bulan {monthsLabel[currentDate.getMonth()]} {currentDate.getFullYear()} belum di-set</div>
                  <div className="text-xs text-amber-700">Klik tombol "Salin dari Bulan Lalu" untuk menyalin jadwal secara instan, atau klik tanggal di kalender untuk menambah jadwal baru.</div>
                </div>
              </div>
              <button
                onClick={handleCopyFromPreviousMonth}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer shadow"
              >
                Salin Sekarang
              </button>
            </div>
          )}

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            {/* Header Hari */}
            <div className="grid grid-cols-7 bg-slate-50 text-center py-3 text-sm font-black text-slate-600 border-b border-slate-100">
              {daysLabel.map((d, i) => <div key={i}>{d}</div>)}
            </div>

            {/* Sel Tanggal */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/50">
              {calendarDays.map((cell, idx) => {
                const dayOfWeek = cell.date.getDay();
                const dateStr = cell.date.toISOString().split('T')[0];

                // 1. Get weekly active schedules for this day of week
                let todaysSchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek && s.status === 'ACTIVE');

                // 2. Remove students who rescheduled OUT of this date
                todaysSchedules = todaysSchedules.filter(s => {
                  const isRescheduledOut = replacements.some(r => 
                     r.scheduleId === s.id && 
                     r.status === 'ACCEPTED' && 
                     r.originalDate && r.originalDate.split('T')[0] === dateStr
                  );
                  return !isRescheduledOut;
                });

                // 3. Add students who rescheduled INTO this date
                const rescheduledIn = replacements.filter(r => 
                  r.status === 'ACCEPTED' && 
                  r.replacementDate && 
                  r.replacementDate.split('T')[0] === dateStr
                );

                rescheduledIn.forEach(r => {
                  if (r.schedule && !todaysSchedules.some(s => s.id === r.scheduleId)) {
                    todaysSchedules.push({
                      id: `rescheduled-${r.id}`,
                      studentId: r.schedule.studentId,
                      classId: r.schedule.classId,
                      dayOfWeek: dayOfWeek,
                      startTime: r.newStartTime || r.schedule.startTime,
                      endTime: r.newEndTime || r.schedule.endTime,
                      status: 'ACTIVE',
                      student: r.schedule.student,
                      class: r.schedule.class,
                      isRescheduled: true
                    });
                  }
                });

                const isToday = cell.isCurrentMonth &&
                  cell.date.getDate() === today.getDate() &&
                  cell.date.getMonth() === today.getMonth() &&
                  cell.date.getFullYear() === today.getFullYear();
                const hasSchedules = cell.isCurrentMonth && todaysSchedules.length > 0;

                // Group by class name for tooltip
                const classGroups = {};
                todaysSchedules.forEach(s => {
                  if (s.class) {
                    const key = s.class.namaKelas;
                    if (!classGroups[key]) classGroups[key] = [];
                    classGroups[key].push(s.student?.namaAnak || 'Unknown');
                  }
                });

                return (
                  <div
                    key={idx}
                    className={`relative min-h-[130px] p-3 transition-all flex flex-col group ${
                      !cell.isCurrentMonth ? 'bg-slate-50/10 text-slate-300 pointer-events-none' :
                      'bg-white cursor-pointer hover:bg-indigo-50/30'
                    } ${isToday ? 'ring-2 ring-inset ring-indigo-400' : ''}`}
                    onClick={cell.isCurrentMonth ? (e) => handleOpenDayDetail(cell, todaysSchedules, e) : undefined}
                    onMouseEnter={() => hasSchedules && setHoveredCell(idx)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {/* Angka tanggal */}
                    <div className={`text-right text-sm font-bold p-0.5 mb-2 ${isToday ? 'text-indigo-600' : cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                      {isToday ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-black">{cell.dayNum}</span>
                      ) : cell.dayNum}
                    </div>

                    {/* Badge jumlah kelas */}
                    {hasSchedules && (
                      <div className="flex-1 flex flex-col gap-1">
                        {Object.entries(classGroups).slice(0, 2).map(([className, students], i) => (
                          <div key={i} className={`text-xs font-bold px-2 py-1 rounded truncate border ${getClassColor('', className)}`}>
                            {students.length} anak · {className.split(' ').slice(0, 2).join(' ')}
                          </div>
                        ))}
                        {Object.keys(classGroups).length > 2 && (
                          <div className="text-xs text-slate-400 font-bold pl-2 mt-0.5">+{Object.keys(classGroups).length - 2} kelas lagi</div>
                        )}
                      </div>
                    )}

                    {/* Add/Edit icon saat hover */}
                    {cell.isCurrentMonth && (
                      <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlusCircle size={13} className="text-slate-400 hover:text-indigo-600" />
                      </div>
                    )}

                    {/* Tooltip Popup */}
                    {hoveredCell === idx && hasSchedules && (
                      <div
                        className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-4 min-w-[200px] max-w-[240px] pointer-events-none"
                        style={{ bottom: '105%', left: '50%', transform: 'translateX(-50%)' }}
                      >
                        <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <CalendarIcon size={11} />
                          {cell.dayNum} {monthsLabel[currentDate.getMonth()]}
                        </div>
                        <div className="space-y-2">
                          {Object.entries(classGroups).map(([className, students], i) => (
                            <div key={i} className="space-y-1">
                              <div className={`text-xs font-bold px-2 py-0.5 rounded border inline-block ${getClassColor('', className)}`}>
                                {className}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
                                <Users size={10} />
                                <span>{students.length} siswa: {students.join(', ')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-indigo-500 font-bold flex items-center gap-1.5">
                          <Edit3 size={10} />
                          Klik untuk kelola jadwal hari ini
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-3 border-t border-slate-50">
            <span className="font-bold text-slate-500 text-sm">Legenda:</span>
            {[['bg-emerald-500', 'Menggambar'], ['bg-amber-500', 'Bermain'], ['bg-sky-500', 'Bahasa Inggris'], ['bg-slate-400', 'Lainnya']].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-sm font-semibold">
                <span className={`w-3.5 h-3.5 rounded-full ${color}`} />
                <span className="text-slate-600">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-auto text-sm font-semibold">
              <span className="w-3.5 h-3.5 rounded border-2 border-indigo-400" />
              <span className="text-slate-500">Hari ini</span>
            </div>
          </div>
        </div>

        {/* Riwayat Reschedule */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-amber-600" />
            <span>Persetujuan Reschedule</span>
          </h2>
          <div className="overflow-y-auto max-h-[520px] space-y-3 pr-1">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : replacements.length === 0 ? (
              <div className="text-center text-slate-400 py-10 text-sm italic">Belum ada request reschedule.</div>
            ) : (
              replacements.map((rep) => {
                const isPending = rep.status === 'PENDING';
                const isAccepted = rep.status === 'ACCEPTED';
                return (
                  <div key={rep.id} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition-all space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{rep.schedule.student.namaAnak}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isAccepted ? 'bg-emerald-50 text-emerald-700' :
                        rep.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>{rep.status}</span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1.5">
                      <div><strong>Alasan:</strong> {rep.reason}</div>
                      <div><strong>Jadwal Batal:</strong> {new Date(rep.originalDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ({rep.schedule.class.namaKelas})</div>
                      {rep.replacementDate && (
                        <div><strong>Usulan Baru:</strong> {new Date(rep.replacementDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} pada {rep.newStartTime} - {rep.newEndTime}</div>
                      )}
                    </div>
                    {isPending && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <span className="text-xs text-slate-400 font-semibold">Simulasi Wali Murid:</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleRespondReplacement(rep.id, 'REJECTED')} className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold cursor-pointer transition-all">
                            <X size={12} /><span>Tolak</span>
                          </button>
                          <button onClick={() => handleRespondReplacement(rep.id, 'ACCEPTED')} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold cursor-pointer transition-all">
                            <Check size={12} /><span>Setuju</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ============ Modal Detail Hari / Edit Jadwal ============ */}
      {dayDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDayDetailModal(null)} />
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Jadwal Harian – {daysLabelFull[dayDetailModal.date.getDay()]}, {dayDetailModal.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{dayDetailModal.daySchedules.length} sesi kelas aktif</p>
              </div>
              <button onClick={() => setDayDetailModal(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Button Tambah Jadwal Baru */}
              {!newScheduleOpen && (
                <button
                  onClick={() => setNewScheduleOpen(true)}
                  className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-white"
                >
                  <PlusCircle size={14} />
                  <span>Tambah Jadwal Les Baru di Hari Ini</span>
                </button>
              )}

              {/* Form Tambah Jadwal Baru (Expandable) */}
              {newScheduleOpen && (
                <form onSubmit={handleAddSchedule} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2">
                    <h3 className="text-xs font-bold text-indigo-900 uppercase">Tambah Jadwal Baru</h3>
                    <button type="button" onClick={() => setNewScheduleOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Siswa</label>
                      <select
                        required
                        value={newScheduleForm.studentId}
                        onChange={(e) => setNewScheduleForm(f => ({ ...f, studentId: e.target.value }))}
                        className={selectCls}
                      >
                        <option value="">-- Pilih Siswa --</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.namaAnak} (Ortu: {s.namaOrtu})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kelas / Program</label>
                      <select
                        required
                        value={newScheduleForm.classId}
                        onChange={(e) => setNewScheduleForm(f => ({ ...f, classId: e.target.value }))}
                        className={selectCls}
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.namaKelas} - {c.tipe} ({c.kategori})</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jam Mulai</label>
                        <input
                          type="time"
                          required
                          value={newScheduleForm.startTime}
                          onChange={(e) => setNewScheduleForm(f => ({ ...f, startTime: e.target.value }))}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jam Selesai</label>
                        <input
                          type="time"
                          required
                          value={newScheduleForm.endTime}
                          onChange={(e) => setNewScheduleForm(f => ({ ...f, endTime: e.target.value }))}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button type="button" onClick={() => setNewScheduleOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
                      <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1">
                        <Check size={12} /><span>Simpan</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* List Jadwal Hari Ini */}
              <div className="space-y-3">
                {dayDetailModal.daySchedules.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-100">
                    Belum ada jadwal kelas yang terdaftar pada hari ini.
                  </div>
                ) : (
                  dayDetailModal.daySchedules.map((schedule) => (
                    <div key={schedule.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          {editingSchedule === schedule.id ? (
                            <span className="font-bold text-indigo-700 text-xs">Sedang Mengedit Jadwal</span>
                          ) : (
                            <>
                              <div className="font-bold text-slate-800 text-sm">{schedule.student?.namaAnak || 'Siswa tidak ditemukan'}</div>
                              <div className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-block mt-1 ${getClassColor(schedule.class?.tipe, schedule.class?.namaKelas)}`}>
                                {schedule.class?.namaKelas || 'Kelas tidak ditemukan'}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {editingSchedule !== schedule.id && (
                            <>
                              <button
                                onClick={() => handleStartEdit(schedule)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit Jadwal"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenReplaceModal(schedule, dayDetailModal.dateStr)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Reschedule"
                              >
                                <ArrowRightLeft size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Hapus Jadwal"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editingSchedule === schedule.id ? (
                        <div className="space-y-3 pt-2 border-t border-slate-100/50">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Siswa</label>
                            <select
                              value={editForm.studentId}
                              onChange={(e) => setEditForm(f => ({ ...f, studentId: e.target.value }))}
                              className={selectCls}
                            >
                              {students.map(s => <option key={s.id} value={s.id}>{s.namaAnak} (Ortu: {s.namaOrtu})</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Kelas</label>
                            <select
                              value={editForm.classId}
                              onChange={(e) => setEditForm(f => ({ ...f, classId: e.target.value }))}
                              className={selectCls}
                            >
                              {classes.map(c => <option key={c.id} value={c.id}>{c.namaKelas} - {c.tipe}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jam Mulai</label>
                              <input
                                type="time"
                                value={editForm.startTime}
                                onChange={(e) => setEditForm(f => ({ ...f, startTime: e.target.value }))}
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jam Selesai</label>
                              <input
                                type="time"
                                value={editForm.endTime}
                                onChange={(e) => setEditForm(f => ({ ...f, endTime: e.target.value }))}
                                className={inputCls}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setEditingSchedule(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-all">Batal</button>
                            <button type="button" onClick={() => handleSaveEdit(schedule.id)} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1 shadow-sm">
                              <Save size={12} /><span>Simpan</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock size={12} />
                          <span>{schedule.startTime} – {schedule.endTime}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ Reschedule Modal ============ */}
      {replaceModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseReplaceModal} />
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Ajukan Reschedule</h2>
              <button onClick={handleCloseReplaceModal} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-800">Reschedule jadwal {selectedSchedule.student?.namaAnak}</div>
                <div className="text-xs text-slate-400">Kelas {selectedSchedule.class?.namaKelas} (Jadwal asli: {daysLabelFull[selectedSchedule.dayOfWeek]} {selectedSchedule.startTime}–{selectedSchedule.endTime})</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Dibatalkan</label>
                  <input type="date" required value={originalDate} onChange={(e) => setOriginalDate(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none text-sm text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Alasan Pembatalan</label>
                  <input type="text" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Sakit, acara keluarga, dll..." className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none text-sm text-slate-800" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Rekomendasi Jadwal Pengganti</h3>
                {loadingRecommendations ? (
                  <div className="text-center py-4"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : recommendations.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-slate-400 text-xs text-center border border-slate-100">Tidak ada slot kosong yang cocok dalam 14 hari ke depan.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-indigo-50/20 hover:bg-indigo-50/50 flex items-center justify-between transition-all">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-700">{new Date(rec.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                          <div className="text-[10px] text-slate-400">Pukul {rec.startTime} – {rec.endTime} • Sisa {rec.availableSlots} slot</div>
                        </div>
                        <button onClick={() => handleCreateReplacement(rec)} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold">Pilih</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Set Manual Jadwal Pengganti (Admin)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal</label>
                    <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jam Mulai</label>
                    <input type="time" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jam Selesai</label>
                    <input type="time" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs" />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!manualDate}
                  onClick={() => handleCreateReplacement(null)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Ajukan Jadwal Pengganti Manual
                </button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button onClick={() => handleCreateReplacement(null)} className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all">Ajukan Tanpa Slot Pengganti</button>
                <button onClick={handleCloseReplaceModal} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
