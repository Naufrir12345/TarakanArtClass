import { useState, useEffect } from 'react';
import api from '../api/axios';
import { PlusCircle, Edit3, Trash2, BookOpen, DollarSign, Tag, Loader2, Save, X, Users, Zap, Star } from 'lucide-react';

const CLASS_CATEGORIES = ['REGULAR', 'EXTRA_CLASS'];
const CLASS_SUBJECTS = ['Menggambar', 'Bermain', 'Bahasa Inggris', 'Matematika', 'Sains', 'Musik', 'Tari', 'Lainnya'];

const categoryConfig = {
  REGULAR: {
    label: 'Regular',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    icon: Star,
    desc: 'Kelas rutin mingguan',
  },
  EXTRA_CLASS: {
    label: 'Extra Class',
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: Zap,
    desc: 'Kelas tambahan / fleksibel',
  },
};

const emptyForm = { namaKelas: '', harga: '', tipe: 'Menggambar', kategori: 'REGULAR', maxCapacity: 10, description: '' };

export default function ClassManagementPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newClass, setNewClass] = useState(emptyForm);
  const [editingClass, setEditingClass] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | REGULAR | EXTRA_CLASS

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/classes');
      setClasses(res.data);
    } catch (err) {
      console.error('Gagal mengambil kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newClass.namaKelas || !newClass.harga) return;
    try {
      await api.post('/api/classes', { ...newClass, harga: Number(newClass.harga), maxCapacity: Number(newClass.maxCapacity) });
      setNewClass(emptyForm);
      fetchClasses();
    } catch (err) {
      console.error('Gagal menambah kelas:', err);
      alert('Gagal menambah kelas. Pastikan Anda memiliki akses.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kelas ini? Semua jadwal yang terhubung akan ikut terhapus.')) return;
    try {
      await api.delete(`/api/classes/${id}`);
      fetchClasses();
    } catch (err) {
      alert('Gagal menghapus kelas.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/api/classes/${editingClass.id}`, {
        namaKelas: editingClass.namaKelas,
        harga: Number(editingClass.harga),
        tipe: editingClass.tipe,
        kategori: editingClass.kategori,
        maxCapacity: Number(editingClass.maxCapacity),
        description: editingClass.description,
      });
      setEditingClass(null);
      fetchClasses();
    } catch (err) {
      alert('Gagal memperbarui kelas.');
    }
  };

  const filteredClasses = activeTab === 'ALL'
    ? classes
    : classes.filter(c => (c.kategori || 'REGULAR') === activeTab);

  const regularCount = classes.filter(c => (c.kategori || 'REGULAR') === 'REGULAR').length;
  const extraCount = classes.filter(c => c.kategori === 'EXTRA_CLASS').length;

  const FormField = ({ label, children }) => (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );

  const inputCls = 'w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-800 bg-white transition-all';
  const selectCls = `${inputCls} cursor-pointer`;

  const ClassForm = ({ data, onChange, onSubmit, onCancel, isEdit }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Kategori Kelas - Prominent */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori Kelas</label>
        <div className="grid grid-cols-2 gap-2">
          {CLASS_CATEGORIES.map((cat) => {
            const cfg = categoryConfig[cat];
            const Icon = cfg.icon;
            const isSelected = (data.kategori || 'REGULAR') === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onChange({ ...data, kategori: cat })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                  isSelected ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={14} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>{cfg.label}</span>
                </div>
                <div className={`text-xs ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>{cfg.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <FormField label="Nama Kelas">
        <input
          placeholder="Contoh: Menggambar Pemula A"
          value={data.namaKelas}
          onChange={(e) => onChange({ ...data, namaKelas: e.target.value })}
          required
          className={inputCls}
        />
      </FormField>

      <FormField label="Mata Pelajaran / Tipe">
        <select value={data.tipe} onChange={(e) => onChange({ ...data, tipe: e.target.value })} className={selectCls}>
          {CLASS_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Harga / Sesi (Rp)">
          <input
            placeholder="350000"
            type="number"
            value={data.harga}
            onChange={(e) => onChange({ ...data, harga: e.target.value })}
            required
            className={inputCls}
          />
        </FormField>
        <FormField label="Kapasitas (siswa)">
          <input
            type="number"
            min="1"
            max="50"
            value={data.maxCapacity}
            onChange={(e) => onChange({ ...data, maxCapacity: e.target.value })}
            className={inputCls}
          />
        </FormField>
      </div>

      <FormField label="Deskripsi (opsional)">
        <input
          placeholder="Kelas menggambar untuk anak usia 5-10 tahun"
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          className={inputCls}
        />
      </FormField>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm">
          <Save size={13} />
          <span>{isEdit ? 'Simpan Perubahan' : 'Tambah Kelas'}</span>
        </button>
        {isEdit && (
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5">
            <X size={13} />
            <span>Batal</span>
          </button>
        )}
      </div>
    </form>
  );

  if (loading && classes.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500 font-medium">Memuat data kelas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manajemen Kelas</h1>
        <p className="text-slate-500 mt-1">Kelola program les, tipe materi, kategori (Regular/Extra Class), dan tarif biaya per kelas.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Kelas', value: classes.length, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Kelas Regular', value: regularCount, icon: Star, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Extra Class', value: extraCount, icon: Zap, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}><Icon size={18} /></div>
            <div>
              <div className="text-xl font-black text-slate-800">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4 h-fit">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            {editingClass ? <Edit3 size={18} className="text-amber-500" /> : <PlusCircle size={18} className="text-indigo-600" />}
            <span>{editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}</span>
          </h3>
          {editingClass ? (
            <ClassForm
              data={editingClass}
              onChange={setEditingClass}
              onSubmit={handleUpdate}
              onCancel={() => setEditingClass(null)}
              isEdit
            />
          ) : (
            <ClassForm
              data={newClass}
              onChange={setNewClass}
              onSubmit={handleAdd}
              isEdit={false}
            />
          )}
        </div>

        {/* Daftar Kelas */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={18} className="text-slate-600" />
              <span>Daftar Program Les</span>
            </h3>
            {/* Filter Tab */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {['ALL', 'REGULAR', 'EXTRA_CLASS'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'ALL' ? 'Semua' : tab === 'REGULAR' ? 'Regular' : 'Extra'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Card View */}
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic text-sm">Belum ada kelas terdaftar.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredClasses.map((cls) => {
                const kat = cls.kategori || 'REGULAR';
                const cfg = categoryConfig[kat] || categoryConfig['REGULAR'];
                const Icon = cfg.icon;
                const enrollment = cls._count?.enrollments || 0;
                const capacity = cls.maxCapacity || 10;
                const fillPct = Math.min((enrollment / capacity) * 100, 100);

                return (
                  <div key={cls.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:shadow-sm transition-all group space-y-3">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate">{cls.namaKelas}</div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border ${cfg.badge}`}>
                            <Icon size={11} />
                            {cfg.label}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-500">
                            <Tag size={10} />
                            {cls.tipe}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button onClick={() => setEditingClass({ ...cls, kategori: cls.kategori || 'REGULAR', maxCapacity: cls.maxCapacity || 10 })} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDelete(cls.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Harga */}
                    <div className="flex items-center gap-1 text-base font-black text-slate-800">
                      <DollarSign size={14} className="text-emerald-500" />
                      Rp {Number(cls.harga).toLocaleString('id-ID')}
                      <span className="text-xs font-normal text-slate-400">/ sesi</span>
                    </div>

                    {/* Kapasitas bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5"><Users size={12} /> {enrollment} / {capacity} siswa</span>
                        <span className={fillPct >= 90 ? 'text-rose-500 font-bold' : 'text-slate-400'}>{Math.round(fillPct)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-rose-400' : fillPct >= 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    {cls.description && (
                      <div className="text-xs text-slate-450 italic truncate">{cls.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}