import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Trash2, Plus, Edit2, Key, AtSign, Phone, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ParentAccountsPage() {
  const [parentAccounts, setParentAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    studentIds: [],
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [parentsRes, studentsRes] = await Promise.all([
        api.get('/api/parent-accounts'),
        api.get('/api/students?limit=200'),
      ]);
      setParentAccounts(parentsRes.data || []);
      setStudents(studentsRes.data?.data || studentsRes.data || []);
    } catch (err) {
      console.error('Error fetching parent accounts:', err);
      setError('Gagal memuat data akun orang tua.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (studentId) => {
    setFormData((prev) => {
      const studentIds = prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId];
      return { ...prev, studentIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Nama, Email, dan No HP wajib diisi.');
      return;
    }

    try {
      if (editingId) {
        // Update parent account
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          studentIds: formData.studentIds,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await api.patch(`/api/parent-accounts/${editingId}`, payload);
        setSuccess(`Akun ${formData.name} berhasil diperbarui!`);
      } else {
        // Create parent account
        const payload = {
          ...formData,
          password: formData.password || 'password123',
        };
        await api.post('/api/parent-accounts', payload);
        setSuccess(`Akun orang tua ${formData.name} berhasil dibuat!`);
      }

      setFormData({ name: '', email: '', phone: '', password: '', studentIds: [] });
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan akun orang tua.');
    }
  };

  const handleEdit = (parent) => {
    setEditingId(parent.id);
    setFormData({
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      password: '',
      studentIds: parent.students?.map((s) => s.id) || [],
    });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus akun orang tua "${name}"? Hubungan murid akan terlepas.`)) return;

    try {
      await api.delete(`/api/parent-accounts/${id}`);
      setSuccess(`Akun orang tua ${name} berhasil dihapus.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus akun.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', password: '', studentIds: [] });
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manajemen Akun Orang Tua</h1>
          <p className="text-sm text-slate-500 mt-1">Buat, kelola akun login untuk Parent Portal, dan hubungkan dengan murid.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
          title="Refresh Data"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-150 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-150 text-sm">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel */}
        <div className="glass-card rounded-2xl p-6 bg-white border border-slate-200/80 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-5">
            {editingId ? 'Edit Akun Orang Tua' : 'Buat Akun Baru'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Nama Orang Tua</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Users size={16} /></span>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><AtSign size={16} /></span>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">No HP WhatsApp</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Phone size={16} /></span>
                <input
                  type="text"
                  required
                  placeholder="0812xxxxxxxx"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Password {editingId && <span className="text-slate-400 lowercase">(kosongkan jika tidak diubah)</span>}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Key size={16} /></span>
                <input
                  type="password"
                  placeholder={editingId ? "••••••••" : "Default: password123"}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Hubungkan dengan Anak/Murid</label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.studentIds.includes(student.id)}
                      onChange={() => handleCheckboxChange(student.id)}
                    />
                    <span>{student.namaAnak} <span className="text-slate-400">({student.namaOrtu})</span></span>
                  </label>
                ))}
                {students.length === 0 && <p className="text-xs text-slate-400">Tidak ada murid.</p>}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                {editingId ? 'Simpan' : 'Daftar Akun'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs transition-all"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">Daftar Akun Orang Tua</h2>
            <span className="text-xs font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-full border border-indigo-100 shadow-sm">
              {parentAccounts.length} Akun
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : parentAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Users size={48} className="text-slate-200 mb-3" />
                <p className="text-sm font-semibold">Belum ada akun orang tua terdaftar</p>
              </div>
            ) : (
              parentAccounts.map((parent) => (
                <div key={parent.id} className="p-5 hover:bg-slate-50/40 transition-colors flex justify-between items-start">
                  <div className="space-y-1.5 max-w-[70%]">
                    <h3 className="font-bold text-slate-800 text-sm">{parent.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><AtSign size={13} /> {parent.email}</span>
                      <span className="flex items-center gap-1"><Phone size={13} /> {parent.phone}</span>
                    </div>
                    {/* Associated Students */}
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {parent.students?.map((s) => (
                        <span key={s.id} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase border border-indigo-100/50">
                          🎓 {s.namaAnak}
                        </span>
                      ))}
                      {(!parent.students || parent.students.length === 0) && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full uppercase border border-amber-100/50">
                          ⚠️ Belum Terhubung Murid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(parent)}
                      className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-all"
                      title="Edit Akun"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(parent.id, parent.name)}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-xl transition-all"
                      title="Hapus Akun"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
