import { useState, useEffect } from 'react';
import api from '../api/axios';
import { CreditCard, Check, X, RefreshCw, AlertCircle, Plus } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Manual Invoice state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [paymentType, setPaymentType] = useState('MONTHLY');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        api.get('/api/payments'),
        api.get('/api/students'),
      ]);
      setPayments(paymentsRes.data);
      setStudents(studentsRes.data.data);
    } catch (err) {
      console.error('Error fetching payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (payment, status) => {
    let confirmMsg = `Tandai pembayaran ini sebagai ${status === 'PAID' ? 'Lunas' : 'Batal'}?`;
    
    if (status === 'PAID') {
      confirmMsg = `Tandai pembayaran Rp ${Number(payment.amount).toLocaleString('id-ID')} (${payment.student?.namaAnak}) sebagai LUNAS?\n\nNominal ini akan otomatis tercatat sebagai Pemasukan di Modul Keuangan.`;
    } else if (status === 'CANCELLED') {
      if (payment.paymentType === 'REGISTRATION') {
        confirmMsg = `⚠️ PERHATIAN SISWA BARU:\n\nMembatalkan pembayaran Registrasi ini akan MENGHAPUS data siswa "${payment.student?.namaAnak}" secara otomatis dari sistem (karena pendaftaran batal).\n\nApakah Anda yakin ingin melanjutkan pembatalan?`;
      } else {
        confirmMsg = `Batalkan tagihan ${payment.paymentType} untuk "${payment.student?.namaAnak}"?\n\nStatus tagihan akan menjadi CANCELLED. Data siswa tetap aktif dan tersimpan.`;
      }
    }

    if (confirm(confirmMsg)) {
      try {
        const res = await api.patch(`/api/payments/${payment.id}/status`, { status });
        if (status === 'PAID') {
          alert('✅ Pembayaran berhasil ditandai LUNAS!\n💰 Nominal telah otomatis tercatat ke Modul Keuangan.');
        } else if (status === 'CANCELLED' && payment.paymentType === 'REGISTRATION') {
          alert(res.data.message || 'Pembayaran dibatalkan dan data siswa baru telah dibersihkan.');
        } else {
          alert('Status pembayaran berhasil diperbarui.');
        }
        fetchData();
      } catch (err) {
        alert('Gagal memperbarui status: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!studentId) {
      alert('Pilih siswa terlebih dahulu');
      return;
    }

    try {
      await api.post('/api/payments', {
        studentId,
        amount: parseFloat(amount),
        paymentMethod,
        paymentType,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        notes,
      });
      alert('Invoice berhasil dibuat!');
      fetchData();
      setInvoiceModalOpen(false);
      setStudentId('');
      setAmount('');
      setNotes('');
    } catch (err) {
      alert('Gagal membuat invoice: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              💳 Keuangan & Tagihan Siswa
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Modul Pembayaran 💵</h1>
            <p className="text-emerald-100 mt-2 text-base md:text-lg max-w-2xl">
              Kelola transaksi les, cetak invoice tagihan, dan catat pelunasan siswa (otomatis terhubung dengan Keuangan)
            </p>
          </div>
          <button
            onClick={() => setInvoiceModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-white text-emerald-800 hover:bg-emerald-50 font-black rounded-2xl transition-all shadow-lg hover:scale-105 self-start sm:self-center cursor-pointer"
          >
            <Plus size={20} />
            <span>+ Buat Invoice Manual</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="kid-card rounded-3xl overflow-hidden shadow-md border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Tipe Tagihan</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Nominal (Rp)</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Metode Bayar</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Jatuh Tempo</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Aksi Pelunasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">
                    Belum ada data transaksi atau pembayaran.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isPending = p.status === 'PENDING';
                  const isPaid = p.status === 'PAID';
                  const isReg = p.paymentType === 'REGISTRATION';
                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {p.student?.namaAnak || 'Siswa Hapus'}
                        {isReg && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-extrabold">Siswa Baru</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs font-black uppercase">
                        <span className={`px-2.5 py-1 rounded-xl border ${isReg ? 'bg-purple-50 text-purple-700 border-purple-100' : p.paymentType === 'MONTHLY' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {p.paymentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-mono font-black text-base">
                        Rp {Number(p.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-bold">{p.paymentMethod}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {p.dueDate ? new Date(p.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-full ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : p.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPending && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateStatus(p, 'CANCELLED')}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-all flex items-center gap-1 border border-rose-100 cursor-pointer"
                              title="Batalkan Tagihan"
                            >
                              <X size={14} />
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(p, 'PAID')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Tandai Lunas"
                            >
                              <Check size={14} />
                              <span>Paid & Auto-Income</span>
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

      {/* Create Manual Invoice Modal */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setInvoiceModalOpen(false)} />
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Buat Invoice Manual</h2>
              <button onClick={() => setInvoiceModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Siswa Penerima Tagihan
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
                  Nominal Tagihan (Rupiah)
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 150000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Metode Bayar Rencana
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm text-slate-800"
                  >
                    <option value="QRIS">QRIS</option>
                    <option value="CASH">CASH</option>
                    <option value="TRANSFER">TRANSFER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tipe Pembayaran
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm text-slate-800"
                  >
                    <option value="REGISTRATION">REGISTRATION</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="EXTRA_CLASS">EXTRA_CLASS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tanggal Jatuh Tempo
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Catatan Pembayaran
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
                  onClick={() => setInvoiceModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                >
                  Buat Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
