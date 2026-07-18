import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, FileText, CreditCard, Clock, LogOut, Award, User, Sparkles, AlertCircle } from 'lucide-react';

export default function ParentDashboard() {
  const [parent, setParent] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  
  // Data states
  const [schedule, setSchedule] = useState([]);
  const [reports, setReports] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const parentToken = localStorage.getItem('parentToken');
    const profile = localStorage.getItem('parentProfile');
    
    if (!parentToken || !profile) {
      navigate('/parent/login');
      return;
    }

    setParent(JSON.parse(profile));
    fetchParentProfile(parentToken);
  }, []);

  const fetchParentProfile = async (token) => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/api/parent/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParent(res.data);
      if (res.data.students && res.data.students.length > 0) {
        setSelectedChild(res.data.students[0]);
      }
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat profil orang tua.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild.id);
    }
  }, [selectedChild]);

  const fetchChildData = async (childId) => {
    const token = localStorage.getItem('parentToken');
    try {
      setLoading(true);
      const [schRes, repRes, payRes, attRes] = await Promise.all([
        axios.get(`${baseURL}/api/parent/children/${childId}/schedule`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/api/parent/children/${childId}/reports`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/api/parent/children/${childId}/payments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/api/parent/children/${childId}/attendance`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setSchedule(schRes.data);
      setReports(repRes.data);
      setInvoices(payRes.data.invoices || []);
      setPayments(payRes.data.payments || []);
      setAttendance(attRes.data);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat data anak.');
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    const token = localStorage.getItem('parentToken');
    try {
      setError('');
      // Request payment link
      const res = await axios.post(`${baseURL}/api/invoices/${invoiceId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { snapUrl } = res.data;
      if (snapUrl) {
        window.open(snapUrl, '_blank');
      } else {
        setError('Gagal memproses link pembayaran.');
      }
    } catch (err) {
      setError('Koneksi ke payment gateway gagal.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parentToken');
    localStorage.removeItem('parentProfile');
    navigate('/parent/login');
  };

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-bold text-lg">
            P
          </div>
          <span className="font-extrabold text-slate-800 text-lg tracking-tight">Parent Portal</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-semibold">Selamat Datang, {parent?.name}</span>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Children Selection & Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <User size={18} className="text-indigo-600" />
              Pilih Murid / Anak
            </h3>
            
            <div className="space-y-2">
              {parent?.students?.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`w-full p-3 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 ${
                    selectedChild?.id === child.id
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm font-semibold'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {child.namaAnak.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate max-w-[130px]">{child.namaAnak}</p>
                    <p className="text-[10px] opacity-70">Umur: {child.umur} Tahun</p>
                  </div>
                </button>
              ))}
              {(!parent?.students || parent.students.length === 0) && (
                <p className="text-xs text-slate-400">Tidak ada murid terhubung dengan akun ini.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Data Details (Tabs) */}
        <div className="lg:col-span-3 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-150 text-xs">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm gap-1 overflow-x-auto">
            {[
              { id: 'schedule', name: 'Jadwal Kelas', icon: Calendar },
              { id: 'reports', name: 'Rapor Akademis', icon: FileText },
              { id: 'payments', name: 'Tagihan & Payment', icon: CreditCard },
              { id: 'attendance', name: 'Kehadiran', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-indigo-650 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon size={14} />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* 1. Schedule Tab */}
                {activeTab === 'schedule' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Jadwal Kelas Reguler</h4>
                    {schedule.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">Belum ada jadwal terdaftar untuk murid ini.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {schedule.map((sch) => (
                          <div key={sch.id} className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-2">
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full uppercase">
                              {sch.class?.tipe}
                            </span>
                            <h5 className="font-bold text-slate-850">{sch.class?.namaKelas}</h5>
                            <div className="text-xs text-slate-500 space-y-1">
                              <p>Hari: {days[sch.dayOfWeek]}</p>
                              <p>Jam: {sch.startTime} - {sch.endTime}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Academic Reports Tab */}
                {activeTab === 'reports' && (
                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Rapor Akademis Anak</h4>
                    {reports.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">Belum ada rapor diterbitkan.</p>
                    ) : (
                      <div className="space-y-6">
                        {reports.map((rep) => (
                          <div key={rep.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-indigo-50/50 p-4 flex justify-between items-center border-b border-slate-150">
                              <div>
                                <p className="font-bold text-slate-800">{rep.periode}</p>
                                <p className="text-xs text-slate-500">Rata-rata: {rep.nilaiRataRata ?? '-'} ({rep.nilaiAbjad ?? '-'})</p>
                              </div>
                              <span className="inline-block px-3 py-1 bg-white border border-indigo-200 text-indigo-700 font-mono text-xs rounded-xl font-bold">
                                Key: {rep.credentialKey}
                              </span>
                            </div>
                            <div className="p-4">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 font-bold text-slate-500">
                                    <th className="py-2">Mata Pelajaran</th>
                                    <th className="py-2 text-center">Nilai Angka</th>
                                    <th className="py-2 text-center">Nilai Huruf</th>
                                    <th className="py-2">Catatan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rep.grades?.map((g) => (
                                    <tr key={g.id} className="border-b border-slate-50">
                                      <td className="py-2 font-semibold text-slate-700">{g.namaKelas}</td>
                                      <td className="py-2 text-center">{g.nilaiAngka}</td>
                                      <td className="py-2 text-center font-bold text-indigo-650">{g.nilaiAbjad}</td>
                                      <td className="py-2 text-slate-500">{g.keterangan || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Payments Tab */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Tagihan & History Pembayaran</h4>
                    
                    {/* Unpaid Invoices */}
                    <div className="space-y-3">
                      <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Tagihan Aktif (Invoices)</h5>
                      {invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED').length === 0 ? (
                        <p className="text-xs text-slate-400">Tidak ada tagihan tertunggak.</p>
                      ) : (
                        invoices
                          .filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED')
                          .map((inv) => (
                            <div key={inv.id} className="flex justify-between items-center bg-amber-50/50 p-4 border border-amber-100 rounded-xl">
                              <div>
                                <p className="text-sm font-bold text-slate-800">{inv.invoiceNumber}</p>
                                <p className="text-xs text-slate-500">Jatuh Tempo: {new Date(inv.dueDate).toLocaleDateString('id-ID')}</p>
                                <p className="text-xs text-slate-500 mt-1">Item: {inv.items?.map((item) => item.description).join(', ')}</p>
                              </div>
                              <div className="text-right space-y-2">
                                <p className="font-bold text-slate-800 text-sm">Rp {Number(inv.totalAmount).toLocaleString('id-ID')}</p>
                                <button
                                  onClick={() => handlePayInvoice(inv.id)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                                >
                                  Bayar Sekarang
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                    {/* Paid Transactions */}
                    <div className="space-y-3 pt-4 border-t border-slate-150">
                      <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Riwayat Transaksi Selesai</h5>
                      {invoices.filter((i) => i.status === 'PAID').length === 0 ? (
                        <p className="text-xs text-slate-400">Belum ada riwayat pembayaran.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {invoices
                            .filter((i) => i.status === 'PAID')
                            .map((inv) => (
                              <div key={inv.id} className="flex justify-between items-center bg-slate-50 p-3 border border-slate-100 rounded-xl text-xs">
                                <div>
                                  <p className="font-bold text-slate-800">{inv.invoiceNumber}</p>
                                  <p className="text-slate-400">Dibayar pada: {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('id-ID') : '-'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-slate-800">Rp {Number(inv.totalAmount).toLocaleString('id-ID')}</p>
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase">LUNAS</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Attendance Tab */}
                {activeTab === 'attendance' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Riwayat Kehadiran (Presensi)</h4>
                    {attendance.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">Belum ada riwayat kehadiran tercatat.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {attendance.map((att) => (
                          <div key={att.id} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{att.class?.namaKelas || 'Holiday Class'}</p>
                              <p className="text-slate-400">{new Date(att.date).toLocaleString('id-ID')}</p>
                            </div>
                            <span className="px-2.5 py-1 font-bold bg-emerald-50 text-emerald-700 rounded-full uppercase text-[9px]">
                              {att.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
