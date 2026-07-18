import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Users,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  GraduationCap,
  PlusCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeSchedules: 0,
    pendingPayments: 0,
    totalClasses: 0,
    recentStudents: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsRes, classesRes, schedulesRes, paymentsRes] = await Promise.all([
          api.get('/api/students?limit=5'),
          api.get('/api/classes'),
          api.get('/api/schedules'),
          api.get('/api/payments'),
        ]);

        const pendingCount = paymentsRes.data.filter(p => p.status === 'PENDING').length;

        setStats({
          totalStudents: studentsRes.data.meta?.total || 0,
          activeSchedules: schedulesRes.data.length,
          pendingPayments: pendingCount,
          totalClasses: classesRes.data.length,
          recentStudents: studentsRes.data.data || [],
        });
      } catch (err) {
        console.error('Gagal mengambil data dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Siswa', value: stats.totalStudents, icon: Users, color: 'bg-indigo-50 text-indigo-600', link: '/siswa' },
    { name: 'Jadwal Aktif', value: stats.activeSchedules, icon: Calendar, color: 'bg-emerald-50 text-emerald-600', link: '/jadwal' },
    { name: 'Pembayaran Pending', value: stats.pendingPayments, icon: CreditCard, color: 'bg-amber-50 text-amber-600', link: '/pembayaran' },
    { name: 'Tipe Kelas', value: stats.totalClasses, icon: GraduationCap, color: 'bg-purple-50 text-purple-600', link: '/siswa' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Welcome */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Sistem Informasi Les Anak-Anak PT. Manufindo Cipta Nusantara</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.name} to={card.link} className="glass-card hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-500">{card.name}</span>
                <p className="text-3xl font-black text-slate-800">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon size={24} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Actions + Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions Panel */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link
              to="/registrasi"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-500 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 text-sm">Registrasi Siswa</span>
                  <p className="text-xs text-slate-400">Pendaftaran kelas siswa baru</p>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-slate-400" />
            </Link>

            <Link
              to="/rapor"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-500 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 text-sm">Input Nilai Rapor</span>
                  <p className="text-xs text-slate-400">Nilai akademis & cetak rapor</p>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-slate-400" />
            </Link>

            <Link
              to="/jadwal"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-500 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 text-sm">Auto Replacement</span>
                  <p className="text-xs text-slate-400">Atur penjadwalan & penggantian</p>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Recent Students Table Panel */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Siswa Baru Terdaftar</h2>
            <Link to="/siswa" className="text-sm font-semibold text-indigo-600 hover:underline">
              Lihat Semua
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Anak</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Umur</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Orang Tua</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400 text-sm">
                      Belum ada siswa terdaftar.
                    </td>
                  </tr>
                ) : (
                  stats.recentStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 text-sm font-semibold text-slate-800">{student.namaAnak}</td>
                      <td className="py-3.5 text-sm text-slate-500">{student.umur} Tahun</td>
                      <td className="py-3.5 text-sm text-slate-500">{student.namaOrtu}</td>
                      <td className="py-3.5 text-sm text-slate-500 font-mono">{student.noHpOrtu}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
