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

  const inputCls = 'w-full px-4 py-3 rounded-2xl kid-input text-sm text-slate-800 font-semibold';
  const selectCls = `${inputCls} cursor-pointer`;

  const ClassForm = ({ data, onChange, onSubmit, onCancel, isEdit }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Kategori Kelas - Prominent */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori Kelas</label>
        <div className="grid grid-cols-2 gap-3">
          {CLASS_CATEGORIES.map((cat) => {
            const cfg = categoryConfig[cat];
            const Icon = cfg.icon;
            const isSelected = (data.kategori || 'REGULAR') === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onChange({ ...data, kategori: cat })}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/80 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className={`text-sm font-black ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>{cfg.label}</span>
                </div>
                <div className={`text-xs ${isSelected ? 'text-indigo-500 font-medium' : 'text-slate-400'}`}>{cfg.desc}</div>
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
        <FormField label="Kapasitas (Siswa)">
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

      <FormField label="Deskripsi (Opsional)">
        <input
          placeholder="Kelas menggambar untuk anak usia 5-10 tahun"
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          className={inputCls}
        />
      </FormField>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="flex-1 py-3 kid-button-primary text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer">
          <Save size={16} />
          <span>{isEdit ? 'Simpan Perubahan' : 'Tambah Kelas Baru'}</span>
        </button>
        {isEdit && (
          <button type="button" onClick={onCancel} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer">
            <X size={16} />
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
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              📚 Akademik & Program Les
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Manajemen Kelas & Program 🚀</h1>
            <p className="text-purple-100 mt-2 text-base md:text-lg max-w-2xl">
              Kelola program les, kategori materi (Regular / Extra Class), kuota kapasitas, dan tarif biaya per sesi
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Kelas Terdaftar', value: classes.length, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Kelas Regular Mingguan', value: regularCount, icon: Star, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Extra Class Fleksibel', value: extraCount, icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-100' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="kid-card rounded-2xl border p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
              <div className="text-3xl font-black text-slate-800 mt-1">{value} <span className="text-xs text-slate-400 font-normal">Program</span></div>
            </div>
            <div className={`p-3.5 rounded-2xl border ${color}`}><Icon size={24} /></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel */}
        <div className="kid-card border border-slate-200/80 p-6 rounded-3xl shadow-md space-y-5 h-fit">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            {editingClass ? <Edit3 size={20} className="text-amber-500" /> : <PlusCircle size={20} className="text-indigo-600" />}
            <span>{editingClass ? 'Edit Detail Kelas' : 'Tambah Program Kelas Baru'}</span>
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
        <div className="kid-card border border-slate-200/80 p-6 rounded-3xl shadow-md lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" />
              <span>Daftar Program Les Anak</span>
            </h3>
            {/* Filter Tab */}
            <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto">
              {['ALL', 'REGULAR', 'EXTRA_CLASS'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    activeTab === tab ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'ALL' ? 'Semua Program' : tab === 'REGULAR' ? 'Regular' : 'Extra Class'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Card View */}
          {filteredClasses.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic text-base bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              Belum ada kelas terdaftar dalam kategori ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto pr-1">
              {filteredClasses.map((cls) => {
                const kat = cls.kategori || 'REGULAR';
                const cfg = categoryConfig[kat] || categoryConfig['REGULAR'];
                const Icon = cfg.icon;
                const enrollment = cls._count?.enrollments || 0;
                const capacity = cls.maxCapacity || 10;
                const fillPct = Math.min((enrollment / capacity) * 100, 100);

                return (
                  <div key={cls.id} className="p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-indigo-300 hover:shadow-xl transition-all duration-300 group space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full pointer-events-none -z-0" />
                    
                    {/* Top row */}
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-black text-slate-800 text-base truncate group-hover:text-indigo-600 transition-colors">{cls.namaKelas}</div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border ${cfg.badge}`}>
                            <Icon size={12} />
                            {cfg.label}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                            <Tag size={11} />
                            {cls.tipe}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingClass({ ...cls, kategori: cls.kategori || 'REGULAR', maxCapacity: cls.maxCapacity || 10 })} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(cls.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Harga */}
                    <div className="flex items-baseline gap-1 text-xl font-black text-slate-900 relative z-10">
                      <span className="text-emerald-600">Rp {Number(cls.harga).toLocaleString('id-ID')}</span>
                      <span className="text-xs font-bold text-slate-400">/ sesi</span>
                    </div>

                    {/* Kapasitas bar */}
                    <div className="space-y-1.5 relative z-10 pt-1 border-t border-slate-50">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1.5"><Users size={13} className="text-indigo-500" /> {enrollment} / {capacity} Siswa Terdaftar</span>
                        <span className={fillPct >= 90 ? 'text-rose-500 font-bold' : 'text-slate-500'}>{Math.round(fillPct)}% Full</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${fillPct >= 90 ? 'bg-gradient-to-r from-rose-400 to-red-500' : fillPct >= 60 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    {cls.description && (
                      <div className="text-xs text-slate-400 italic truncate pt-1">{cls.description}</div>
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