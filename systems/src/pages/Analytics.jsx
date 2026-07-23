import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Area, AreaChart
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, Users, Target, BookOpen,
  UserCheck, Activity, Award, Briefcase, Percent, Calendar, Filter, AlertCircle
} from 'lucide-react';

const KPICard = ({ title, value, subtitle, icon: Icon, gradient, textColor = 'text-slate-800' }) => (
  <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-100/85 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
    {/* Decorative background glow */}
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl -mr-8 -mt-8 bg-gradient-to-br ${gradient}`} />
    
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md shadow-indigo-100 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    
    <div className="relative z-10">
      <h3 className={`text-3xl font-extrabold tracking-tight ${textColor}`}>{value}</h3>
      <p className="text-sm font-semibold text-slate-500 mt-1.5">{title}</p>
      {subtitle && (
        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-100">
          {subtitle}
        </span>
      )}
    </div>
    
    {/* Bottom accent bar */}
    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300Origin`} style={{ transformOrigin: 'left' }} />
  </div>
);

const formatRupiah = (num) => {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}jt`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}rb`;
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const CHART_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981'];

export default function Analytics() {
  const formatDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getInitialMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: formatDateStr(start),
      end: formatDateStr(end),
    };
  };

  const initialRange = getInitialMonthRange();
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [dateError, setDateError] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = (sDate, eDate) => {
    setLoading(true);
    setError(null);
    api.get(`/api/analytics?startDate=${sDate}&endDate=${eDate}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching analytics:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, [startDate, endDate]);

  const validateAndUpdateDates = (newStart, newEnd) => {
    const d1 = new Date(newStart);
    const d2 = new Date(newEnd);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return;

    if (d1 > d2) {
      setDateError('Tanggal mulai tidak boleh melebihi tanggal selesai.');
      return;
    }

    const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 32) {
      setDateError('Rentang tanggal maksimal adalah 1 bulan kalender (31 hari).');
      return;
    }

    setDateError('');
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleStartDateChange = (val) => {
    validateAndUpdateDates(val, endDate);
  };

  const handleEndDateChange = (val) => {
    validateAndUpdateDates(startDate, val);
  };

  const applyPreset = (presetType) => {
    const now = new Date();
    if (presetType === 'THIS_MONTH') {
      const range = getInitialMonthRange();
      validateAndUpdateDates(range.start, range.end);
    } else if (presetType === 'LAST_30_DAYS') {
      const past = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      validateAndUpdateDates(formatDateStr(past), formatDateStr(now));
    } else if (presetType === 'LAST_7_DAYS') {
      const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      validateAndUpdateDates(formatDateStr(past), formatDateStr(now));
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 bg-slate-50/50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold text-lg">Menyusun Data Analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 bg-slate-50/50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-50 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Activity className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Gagal Memuat Analytics</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const profit = (data.totalPendapatan || 0) - (data.totalPengeluaran || 0);
  const monthlyChartData = (data.monthlyTrend || []).map(item => ({
    month: item.period,
    Pendapatan: item.income,
    Pengeluaran: item.expense,
    Profit: item.profit,
  }));

  const classChartData = (data.classStats || []).slice(0, 8).map(c => ({
    name: c.namaKelas.length > 12 ? c.namaKelas.substring(0, 12) + '…' : c.namaKelas,
    fullName: c.namaKelas,
    siswa: c.enrolled,
    kapasitas: c.maxCapacity,
    occupancy: c.occupancy,
  }));

  const paymentPieData = data.paymentMethods
    ? Object.entries(data.paymentMethods).map(([name, value]) => ({ name, value }))
    : [];

  const attendanceData = (data.staffPerformance || []).map(s => ({
    name: s.name === 'PRESENT' ? 'Hadir' : s.name === 'ABSENT' ? 'Absen' : s.name === 'EXCUSED' ? 'Izin' : s.name,
    value: s.score,
  }));

  return (
    <div className="p-6 lg:p-10 bg-slate-50/30 min-h-screen max-w-[1600px] mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Award className="w-8 h-8 text-indigo-600" />
            Dashboard Analytics
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium">Monitoring performa finansial, akademik, dan popularitas program kelas</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-semibold text-slate-500 shadow-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Database Connected
          </span>
        </div>
      </div>

      {/* 1. Main KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Pendapatan"
          value={formatRupiah(data.totalPendapatan || 0)}
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-600"
        />
        <KPICard
          title="Total Pengeluaran"
          value={formatRupiah(data.totalPengeluaran || 0)}
          icon={TrendingDown}
          gradient="from-rose-500 to-pink-600"
        />
        <KPICard
          title="Profit Bersih"
          value={formatRupiah(profit)}
          subtitle={profit >= 0 ? 'Surplus' : 'Defisit'}
          icon={TrendingUp}
          gradient={profit >= 0 ? 'from-indigo-500 to-blue-600' : 'from-amber-500 to-orange-600'}
        />
        <KPICard
          title="Total Siswa Terdaftar"
          value={data.totalStudents || 0}
          subtitle={`${data.activeEnrollments || 0} Siswa Aktif`}
          icon={Users}
          gradient="from-violet-500 to-purple-600"
        />
      </div>

      {/* 2. Secondary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <KPICard
          title="Target KPI Operasional"
          value={`${data.kpiAchievement || 0}%`}
          subtitle="Rasio Gabungan Program & Bayar"
          icon={Target}
          gradient="from-cyan-500 to-blue-500"
        />
        <KPICard
          title="Tingkat Kehadiran Siswa"
          value={`${data.attendanceRate || 0}%`}
          subtitle="Rasio Kehadiran Kelas"
          icon={UserCheck}
          gradient="from-emerald-400 to-teal-500"
        />
        <KPICard
          title="Kelas Aktif"
          value={classChartData.filter(c => c.siswa > 0).length}
          subtitle={`${classChartData.length} Total Kelas`}
          icon={BookOpen}
          gradient="from-amber-400 to-orange-500"
        />
      </div>

      {/* 2.5 Staff Salary & Business Balance Analysis Section */}
      <div className="bg-white p-7 rounded-3xl border border-slate-100/90 shadow-sm hover:shadow-md transition-shadow mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 pb-5 mb-5 gap-4">
          <div>
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Analisis Beban Gaji & Keseimbangan Bisnis
            </h3>
            <p className="text-sm text-slate-500 mt-1">Evaluasi pengeluaran gaji karyawan dan dampaknya terhadap arus kas usaha.</p>
          </div>
          <span className={`px-4 py-2 rounded-2xl text-sm font-extrabold border ${
            data.isBusinessBalanced 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}>
            Status Bisnis: {data.businessStatus || 'Kalkulasi...'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Karyawan</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{data.staffCount || 0}</span>
              <span className="text-sm font-semibold text-slate-400">Orang Staf</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Jumlah akun karyawan terdaftar di sistem.</p>
          </div>

          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Beban Gaji Karyawan</span>
            <div className="mt-4">
              <span className="text-2xl font-black text-rose-600">{formatRupiah(data.totalStaffSalary || 0)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Total pengeluaran gaji yang harus dikeluarkan owner per bulan.</p>
          </div>

          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profit Bersih Setelah Gaji</span>
            <div className="mt-4">
              <span className={`text-2xl font-black ${
                (profit - (data.totalStaffSalary || 0)) >= 0 ? 'text-indigo-600' : 'text-rose-600'
              }`}>
                {formatRupiah(profit - (data.totalStaffSalary || 0))}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {(profit - (data.totalStaffSalary || 0)) >= 0 
                ? 'Bisnis dalam keadaan surplus seimbang.' 
                : 'Bisnis dalam keadaan defisit/tidak seimbang.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Trend Area Chart */}
        <div className="bg-white p-7 rounded-3xl border border-slate-100/90 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                Tren Finansial Harian (Naik Turun Transaksi)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Analisis pendapatan, pengeluaran & profit harian (Filter bebas, maks 1 bulan kalender / 31 hari)</p>
            </div>

            {/* Filter Date Controls */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 ml-1" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400 font-bold">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="h-4 w-[1px] bg-slate-300 hidden sm:block" />

              {/* Preset Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('THIS_MONTH')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('LAST_30_DAYS')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                >
                  30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('LAST_7_DAYS')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                >
                  7 Hari
                </button>
              </div>
            </div>
          </div>

          {dateError && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{dateError}</span>
            </div>
          )}

          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatRupiah(v)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }} 
                  formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} 
                />
                <Area type="monotone" name="Pendapatan" dataKey="Pendapatan" stroke="#10b981" fill="url(#colorIncome)" strokeWidth={3} />
                <Area type="monotone" name="Pengeluaran" dataKey="Pengeluaran" stroke="#f43f5e" fill="url(#colorExpense)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center text-slate-400">
              <Briefcase className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm font-medium">Belum ada transaksi keuangan yang tercatat di rentang tanggal ini</p>
            </div>
          )}
        </div>

        {/* Class Occupancy / Popularity Chart */}
        <div className="bg-white p-7 rounded-3xl border border-slate-100/90 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Popularitas Kelas</h3>
              <p className="text-xs text-slate-400 mt-0.5">Siswa terdaftar dibandingkan dengan kapasitas maksimal</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 text-[10px] font-bold text-slate-500 tracking-wider uppercase border border-slate-100">
              Top 8 Classes
            </div>
          </div>
          {classChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={classChartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9' }}
                  formatter={(value, name) => [value, name === 'siswa' ? 'Siswa Terdaftar' : 'Kapasitas']}
                />
                <Bar dataKey="siswa" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={16}>
                  {classChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center text-slate-400">
              <BookOpen className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm font-medium">Belum ada kelas aktif yang terdaftar</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Pie Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <div className="bg-white p-7 rounded-3xl border border-slate-100/90 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-lg text-slate-800 mb-1">Metode Pembayaran</h3>
          <p className="text-xs text-slate-400 mb-6">Distribusi volume finansial berdasarkan metode bayar</p>
          {paymentPieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="w-full sm:w-[60%]">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={paymentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-[40%] flex flex-col gap-3">
                {paymentPieData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <div>
                      <p className="text-xs font-bold text-slate-700">{item.name}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">{formatRupiah(item.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-slate-400">
              <Percent className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm font-medium">Belum ada rincian data pembayaran</p>
            </div>
          )}
        </div>

        {/* Student Attendance Breakdown */}
        <div className="bg-white p-7 rounded-3xl border border-slate-100/90 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-lg text-slate-800 mb-1">Rasio Kehadiran</h3>
          <p className="text-xs text-slate-400 mb-6">Persentase rincian absensi kehadiran siswa</p>
          {attendanceData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="w-full sm:w-[60%]">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-[40%] flex flex-col gap-3">
                {attendanceData.map((item, index) => {
                  const colors = ["#10b981", "#ef4444", "#f59e0b"];
                  return (
                    <div key={item.name} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                      <div>
                        <p className="text-xs font-bold text-slate-700">{item.name}</p>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{item.value} Sesi</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-slate-400">
              <UserCheck className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm font-medium">Belum ada rekapan absensi siswa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}