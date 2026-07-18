import { useState, useEffect } from 'react';
import api from '../api/axios';
import { CreditCard, PlusCircle, Printer, CloudLightning, Eye, Trash2, AlertCircle, CheckCircle, Plus, Trash } from 'lucide-react';

export default function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Invoice Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ description: '', amount: '', quantity: 1 }]);

  // Filter
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoiceRes, studentRes] = await Promise.all([
        api.get('/api/invoices', { params: { status: statusFilter } }),
        api.get('/api/students'),
      ]);
      setInvoices(invoiceRes.data);
      setStudents(studentRes.data);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat invoice.');
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { description: '', amount: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !dueDate || items.some((item) => !item.description || !item.amount)) {
      setError('Mohon lengkapi seluruh data invoice.');
      return;
    }

    try {
      const payload = {
        studentId: selectedStudentId,
        dueDate,
        notes,
        items: items.map((item) => ({
          description: item.description,
          amount: Number(item.amount),
          quantity: Number(item.quantity),
        })),
      };

      await api.post('/api/invoices', payload);
      setSuccess('Invoice berhasil dibuat!');
      setShowAddModal(false);
      // Reset form
      setSelectedStudentId('');
      setDueDate('');
      setNotes('');
      setItems([{ description: '', amount: '', quantity: 1 }]);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat invoice.');
    }
  };

  const handleGetPaymentLink = async (invoiceId) => {
    try {
      setSuccess('Sedang generate link pembayaran...');
      const res = await api.post(`/api/invoices/${invoiceId}/pay`);
      const { snapUrl } = res.data;
      if (snapUrl) {
        window.open(snapUrl, '_blank');
        setSuccess('Link pembayaran berhasil dibuka!');
      } else {
        setError('Gagal memproses link pembayaran.');
      }
      fetchData();
    } catch (err) {
      setError('Koneksi ke payment gateway gagal.');
    }
  };

  const handleSyncToAccurate = async (invoiceId) => {
    try {
      setSuccess('Sedang sinkronisasi ke Accurate Online...');
      const res = await api.post(`/api/accurate/sync/invoice?id=${invoiceId}`);
      if (res.data.success) {
        setSuccess('Invoice berhasil disinkronkan ke Accurate Online!');
      } else {
        setError(`Sync gagal: ${res.data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Gagal menghubungi modul Accurate.');
    }
  };

  const handlePrintPdf = (id) => {
    // const apiURL = 'http://localhost:3000'; // local testing
    const apiURL = import.meta.env.VITE_API_URL || 'https://tarakanartclass-production.up.railway.app';
    window.open(`${apiURL}/api/export/invoice/${id}/pdf`, '_blank');
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Hapus invoice ini?')) return;
    try {
      await api.delete(`/api/invoices/${id}`);
      setSuccess('Invoice berhasil dihapus.');
      fetchData();
    } catch (err) {
      setError('Gagal menghapus invoice.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tagihan & Invoice (Payment Gateway)</h1>
          <p className="text-sm text-slate-500">Kelola invoice tagihan murid dengan integrasi Midtrans Snap & Accurate Online.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-colors text-sm"
        >
          <PlusCircle size={18} />
          Buat Invoice
        </button>
      </div>

      {/* Status Notifications */}
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

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Filter Status:</span>
          <div className="flex gap-2">
            {['', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${statusFilter === status
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {status || 'Semua'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">No. Invoice</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Siswa / Ortu</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Jatuh Tempo</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Total Tagihan</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const statusColors =
                    inv.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700'
                      : inv.status === 'SENT'
                        ? 'bg-blue-50 text-blue-700'
                        : inv.status === 'OVERDUE'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-50 text-slate-700';

                  return (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-4 text-sm font-mono font-bold text-slate-700">{inv.invoiceNumber}</td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-slate-800">{inv.student.namaAnak}</div>
                        <div className="text-xs text-slate-400">Ortu: {inv.student.namaOrtu}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-800">
                        Rp {Number(inv.totalAmount).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${statusColors}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleGetPaymentLink(inv.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                            title="Bayar / Kirim Link"
                          >
                            <CreditCard size={14} />
                            Bayar
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintPdf(inv.id)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg transition-colors"
                          title="Cetak PDF"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => handleSyncToAccurate(inv.id)}
                          className="p-1.5 bg-sky-50 border border-sky-100 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors"
                          title="Sync ke Accurate Online"
                        >
                          <CloudLightning size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 border border-slate-200 hover:bg-red-50 hover:text-red-650 text-slate-400 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                      Belum ada invoice dibuat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateInvoice} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-lg">Buat Invoice Tagihan Baru</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Siswa</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.namaAnak} ({student.namaOrtu})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">Item Tagihan</span>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-semibold"
                >
                  <Plus size={14} /> Tambah Item
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Deskripsi tagihan (e.g. SPP Bulanan Juni)"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    required
                    placeholder="Harga (Rp)"
                    className="w-32 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                  />
                  <input
                    type="number"
                    required
                    placeholder="Qty"
                    className="w-16 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(index)}
                    className="p-2 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Catatan Tambahan (Opsional)</label>
              <textarea
                placeholder="Catatan pembayaran..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm h-16"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Simpan & Rilis Invoice
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
