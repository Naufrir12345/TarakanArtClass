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

  const handleUpdateStatus = async (id, status) => {
    if (confirm(`Tandai pembayaran ini sebagai ${status === 'PAID' ? 'Lunas / Terbayar' : 'Batal'}?`)) {
      try {
        await api.patch(`/api/payments/${id}/status`, { status });
        alert('Status pembayaran berhasil diperbarui');
        fetchData();
      } catch (err) {
        alert('Gagal memperbarui status');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Modul Pembayaran</h1>
          <p className="text-slate-500 mt-1">Kelola transaksi, cetak tagihan & input pelunasan siswa</p>
        </div>
        <button
          onClick={() => setInvoiceModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 self-start"
        >
          <Plus size={18} />
          <span>Buat Invoice Manual</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Siswa</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipe Tagihan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nominal</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Metode</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Jatuh Tempo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                    Belum ada data transaksi/pembayaran.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isPending = p.status === 'PENDING';
                  const isPaid = p.status === 'PAID';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">{p.student.namaAnak}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs font-bold uppercase">{p.paymentType}</td>
                      <td className="px-6 py-4 text-slate-800 font-mono font-semibold">
                        Rp {Number(p.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{p.paymentMethod}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {p.dueDate ? new Date(p.dueDate).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-600'
                              : p.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPending && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'CANCELLED')}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Batalkan Invoice"
                            >
                              <X size={14} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'PAID')}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="Tandai Lunas"
                            >
                              <Check size={14} />
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
