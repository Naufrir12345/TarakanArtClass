import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Package, Plus, Edit3, Trash2, ShoppingCart, TrendingUp,
  AlertTriangle, DollarSign, X, Save, RefreshCw, ChevronDown,
  Tag, BarChart2, Archive, Check, Loader2
} from 'lucide-react';

const CATEGORIES = ['Alat Tulis', 'Buku', 'Alat Gambar', 'Kertas', 'Lainnya'];
const UNITS = ['pcs', 'lusin', 'rim', 'pak', 'set', 'box', 'lembar'];

const catColor = {
  'Alat Tulis': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Buku': 'bg-sky-50 text-sky-700 border-sky-100',
  'Alat Gambar': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Kertas': 'bg-amber-50 text-amber-700 border-amber-100',
  'Lainnya': 'bg-slate-50 text-slate-600 border-slate-200',
};

const emptyForm = {
  namaItem: '', kategori: 'Alat Tulis', hargaBeli: '',
  hargaJual: '', stok: '', satuan: 'pcs', deskripsi: '',
};

const emptySale = { itemId: '', qty: 1, pembeli: '', catatan: '' };

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ITEMS'); // ITEMS | SALES

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Sale Modal
  const [saleModal, setSaleModal] = useState(null); // item object
  const [saleForm, setSaleForm] = useState(emptySale);
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(null);

  // Filter
  const [filterKat, setFilterKat] = useState('ALL');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [itemsRes, summaryRes, salesRes] = await Promise.all([
        api.get('/api/inventory'),
        api.get('/api/inventory/summary'),
        api.get('/api/inventory/sales'),
      ]);
      setItems(itemsRes.data);
      setSummary(summaryRes.data);
      setSales(salesRes.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.patch(`/api/inventory/${editingItem.id}`, form);
      } else {
        await api.post('/api/inventory', form);
      }
      setShowForm(false);
      setEditingItem(null);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      alert('Gagal menyimpan item: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      namaItem: item.namaItem, kategori: item.kategori,
      hargaBeli: item.hargaBeli, hargaJual: item.hargaJual,
      stok: item.stok, satuan: item.satuan, deskripsi: item.deskripsi || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus item "${name}"? Item akan dinonaktifkan.`)) return;
    try {
      await api.delete(`/api/inventory/${id}`);
      fetchAll();
    } catch (err) {
      alert('Gagal menghapus item.');
    }
  };

  const handleOpenSale = (item) => {
    setSaleModal(item);
    setSaleForm({ itemId: item.id, qty: 1, pembeli: '', catatan: '' });
    setSaleSuccess(null);
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    setSaleLoading(true);
    try {
      const res = await api.post('/api/inventory/sales/record', saleForm);
      setSaleSuccess(res.data.message);
      fetchAll();
    } catch (err) {
      alert('Gagal mencatat penjualan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaleLoading(false);
    }
  };

  const filteredItems = filterKat === 'ALL' ? items : items.filter(i => i.kategori === filterKat);

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base text-slate-800 bg-white transition-all shadow-sm';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Inventaris</h1>
          <p className="text-slate-500 mt-1.5 text-sm md:text-base">Kelola stok alat tulis & produk. Setiap penjualan otomatis tercatat di modul Keuangan.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAll} className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition-colors cursor-pointer">
            <RefreshCw size={18} className="text-slate-500" />
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingItem(null); setForm(emptyForm); }}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>Tambah Item</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: 'Total Item Aktif', value: summary.totalItems, icon: Package, color: 'text-indigo-600 bg-indigo-50', fmt: (v) => v },
            { label: 'Nilai Stok (HPP)', value: summary.totalStokValue, icon: Archive, color: 'text-slate-600 bg-slate-50', fmt: (v) => `Rp ${Number(v).toLocaleString('id-ID')}` },
            { label: 'Pendapatan Hari Ini', value: summary.todayRevenue, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', fmt: (v) => `Rp ${Number(v).toLocaleString('id-ID')}` },
            { label: 'Stok Hampir Habis', value: summary.lowStockItems, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50', fmt: (v) => v },
          ].map(({ label, value, icon: Icon, color, fmt }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
              <div className={`p-3.5 rounded-xl ${color} flex-shrink-0`}><Icon size={22} /></div>
              <div className="min-w-0">
                <div className="text-xl font-black text-slate-800 truncate">{fmt(value)}</div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[['ITEMS', 'Stok Item'], ['SALES', 'Riwayat Penjualan']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Items */}
      {activeTab === 'ITEMS' && (
        <>
          {/* Filter kategori */}
          <div className="flex flex-wrap gap-2">
            {['ALL', ...CATEGORIES].map((kat) => (
              <button
                key={kat}
                onClick={() => setFilterKat(kat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  filterKat === kat
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {kat === 'ALL' ? 'Semua' : kat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 text-slate-400 italic">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>Belum ada item inventaris.</p>
            </div>
          ) : (
            /* 4 Card per row */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const margin = item.hargaBeli > 0
                  ? ((Number(item.hargaJual) - Number(item.hargaBeli)) / Number(item.hargaBeli) * 100).toFixed(0)
                  : 0;
                const isLowStock = item.stok <= 5;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col"
                  >
                    {/* Top accent bar by category */}
                    <div className={`h-1.5 ${
                      item.kategori === 'Alat Gambar' ? 'bg-emerald-400' :
                      item.kategori === 'Buku' ? 'bg-sky-400' :
                      item.kategori === 'Alat Tulis' ? 'bg-indigo-400' :
                      item.kategori === 'Kertas' ? 'bg-amber-400' : 'bg-slate-300'
                    }`} />

                    <div className="p-5 flex flex-col flex-1 space-y-4">
                      {/* Name & Category */}
                      <div>
                        <div className="font-bold text-slate-800 text-base leading-tight mb-2">{item.namaItem}</div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${catColor[item.kategori] || catColor['Lainnya']}`}>
                          {item.kategori}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="space-y-1.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-slate-900">Rp {Number(item.hargaJual).toLocaleString('id-ID')}</span>
                          <span className="text-xs text-slate-400">/ {item.satuan}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>HPP: Rp {Number(item.hargaBeli).toLocaleString('id-ID')}</span>
                          <span className="text-emerald-600 font-bold">+{margin}%</span>
                        </div>
                      </div>

                      {/* Stock */}
                      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${isLowStock ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50 border border-slate-100'}`}>
                        <div className="flex items-center gap-1.5">
                          {isLowStock ? <AlertTriangle size={14} className="text-rose-500" /> : <Archive size={14} className="text-slate-400" />}
                          <span className={`text-sm font-bold ${isLowStock ? 'text-rose-600' : 'text-slate-600'}`}>
                            {item.stok} {item.satuan}
                          </span>
                        </div>
                        <span className={`text-xs font-semibold ${isLowStock ? 'text-rose-400' : 'text-slate-400'}`}>
                          {isLowStock ? 'Stok Menipis!' : 'Tersedia'}
                        </span>
                      </div>

                      {item.deskripsi && (
                        <p className="text-xs text-slate-400 italic truncate">{item.deskripsi}</p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1 mt-auto">
                        <button
                          onClick={() => handleOpenSale(item)}
                          disabled={item.stok === 0}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100"
                        >
                          <ShoppingCart size={14} />
                          <span>Jual</span>
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.namaItem)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Sales History */}
      {activeTab === 'SALES' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <BarChart2 size={18} className="text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">Riwayat Penjualan</h3>
            <span className="ml-auto text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-lg">
              ✅ Setiap transaksi otomatis tercatat di Modul Keuangan
            </span>
          </div>
          {sales.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic text-sm">Belum ada riwayat penjualan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50">
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Item</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3">Harga Jual</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Pembeli</th>
                    <th className="px-5 py-3">Status Keuangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {new Date(sale.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-slate-800">{sale.item?.namaItem}</td>
                      <td className="px-5 py-3 text-sm text-slate-600">{sale.qty} {sale.item?.satuan}</td>
                      <td className="px-5 py-3 text-sm text-slate-600">Rp {Number(sale.hargaJual).toLocaleString('id-ID')}</td>
                      <td className="px-5 py-3 text-sm font-bold text-emerald-700">Rp {Number(sale.totalHarga).toLocaleString('id-ID')}</td>
                      <td className="px-5 py-3 text-xs text-slate-400">{sale.pembeli || '-'}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Check size={9} />
                          Tercatat di Keuangan
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============ Add/Edit Item Modal ============ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingItem(null); }} />
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {editingItem ? <Edit3 size={16} className="text-amber-500" /> : <Plus size={16} className="text-indigo-600" />}
                {editingItem ? 'Edit Item' : 'Tambah Item Baru'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Item</label>
                  <input
                    required value={form.namaItem} onChange={(e) => setForm(f => ({ ...f, namaItem: e.target.value }))}
                    placeholder="Contoh: Pensil 2B Faber-Castell"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kategori</label>
                  <select value={form.kategori} onChange={(e) => setForm(f => ({ ...f, kategori: e.target.value }))} className={selectCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Satuan</label>
                  <select value={form.satuan} onChange={(e) => setForm(f => ({ ...f, satuan: e.target.value }))} className={selectCls}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Harga Beli / HPP (Rp)</label>
                  <input
                    type="number" required value={form.hargaBeli} onChange={(e) => setForm(f => ({ ...f, hargaBeli: e.target.value }))}
                    placeholder="5000"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Harga Jual (Rp)</label>
                  <input
                    type="number" required value={form.hargaJual} onChange={(e) => setForm(f => ({ ...f, hargaJual: e.target.value }))}
                    placeholder="8000"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Stok Awal</label>
                  <input
                    type="number" required value={form.stok} onChange={(e) => setForm(f => ({ ...f, stok: e.target.value }))}
                    placeholder="50"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Margin</label>
                  <div className={`${inputCls} bg-slate-50 text-emerald-700 font-bold`}>
                    {form.hargaBeli && form.hargaJual
                      ? `+${(((Number(form.hargaJual) - Number(form.hargaBeli)) / Number(form.hargaBeli)) * 100).toFixed(1)}%`
                      : '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Deskripsi (opsional)</label>
                  <input
                    value={form.deskripsi} onChange={(e) => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                    placeholder="Keterangan tambahan..."
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                  <Save size={14} />
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Item'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ Sale Modal ============ */}
      {saleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setSaleModal(null); setSaleSuccess(null); }} />
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50/60">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingCart size={16} className="text-indigo-600" />
                  Catat Penjualan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Penjualan akan otomatis tercatat di Keuangan</p>
              </div>
              <button onClick={() => { setSaleModal(null); setSaleSuccess(null); }} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            {saleSuccess ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Check size={28} className="text-emerald-600" />
                </div>
                <div className="font-bold text-slate-800">Penjualan Berhasil Dicatat!</div>
                <p className="text-sm text-slate-500">{saleSuccess}</p>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setSaleModal(null); setSaleSuccess(null); }} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all">Tutup</button>
                  <button onClick={() => { setSaleSuccess(null); setSaleForm(f => ({ ...f, qty: 1, pembeli: '', catatan: '' })); }} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all">Jual Lagi</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecordSale} className="p-5 space-y-4">
                {/* Item info */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{saleModal.namaItem}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Stok: {saleModal.stok} {saleModal.satuan} • Harga: Rp {Number(saleModal.hargaJual).toLocaleString('id-ID')}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catColor[saleModal.kategori] || catColor['Lainnya']}`}>
                    {saleModal.kategori}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah ({saleModal.satuan})</label>
                  <input
                    type="number" min="1" max={saleModal.stok} required
                    value={saleForm.qty}
                    onChange={(e) => setSaleForm(f => ({ ...f, qty: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>

                {/* Preview total */}
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <span className="text-xs text-indigo-600 font-semibold">Total Harga</span>
                  <span className="text-base font-black text-indigo-700">
                    Rp {(saleForm.qty * Number(saleModal.hargaJual)).toLocaleString('id-ID')}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Pembeli (opsional)</label>
                  <input
                    value={saleForm.pembeli} onChange={(e) => setSaleForm(f => ({ ...f, pembeli: e.target.value }))}
                    placeholder="Nama orang tua / pembeli"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Catatan (opsional)</label>
                  <input
                    value={saleForm.catatan} onChange={(e) => setSaleForm(f => ({ ...f, catatan: e.target.value }))}
                    placeholder="Keterangan tambahan..."
                    className={inputCls}
                  />
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-700 flex items-center gap-2">
                  <TrendingUp size={13} />
                  <span>Penjualan ini akan <strong>otomatis dicatat</strong> sebagai Pemasukan di Modul Keuangan</span>
                </div>

                <div className="flex gap-2">
                  <button type="submit" disabled={saleLoading} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                    {saleLoading ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                    <span>Catat Penjualan</span>
                  </button>
                  <button type="button" onClick={() => { setSaleModal(null); setSaleSuccess(null); }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all">
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
