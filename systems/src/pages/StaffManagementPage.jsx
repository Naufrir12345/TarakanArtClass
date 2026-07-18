import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Trash2, Plus, Edit2, Shield, DollarSign, Key, AtSign, User, Award, CheckCircle2, AlertCircle } from 'lucide-react';

const formatRupiah = (num) => {
  return `Rp ${(num || 0).toLocaleString('id-ID')}`;
};

export default function StaffManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create employee state
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    salary: '',
  });

  // Edit salary state
  const [editingStaff, setEditingStaff] = useState(null); // { id, name, salary }
  const [newSalary, setNewSalary] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/api/roles/users'),
        api.get('/api/roles'),
      ]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err) {
      console.error('Error fetching staff details:', err);
      setError('Gagal memuat data staff dan role.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.roleId) {
      setError('Nama, Email, dan Role wajib diisi.');
      return;
    }

    try {
      const payload = {
        name: newStaff.name,
        email: newStaff.email,
        password: newStaff.password || 'password123',
        roleId: newStaff.roleId,
        salary: Number(newStaff.salary || 0),
      };

      await api.post('/api/roles/users', payload);
      setSuccess(`Karyawan ${payload.name} berhasil ditambahkan!`);
      setNewStaff({ name: '', email: '', password: '', roleId: '', salary: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan karyawan.');
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus karyawan "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;

    try {
      await api.delete(`/api/roles/users/${id}`);
      setSuccess(`Karyawan ${name} berhasil dihapus.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus karyawan.');
    }
  };

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      await api.patch(`/api/roles/users/${editingStaff.id}/salary`, {
        salary: Number(newSalary),
      });
      setSuccess(`Gaji ${editingStaff.name} berhasil disesuaikan.`);
      setEditingStaff(null);
      setNewSalary('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyesuaikan gaji.');
    }
  };

  return (
    <div className="p-6 md:p-10 bg-slate-50/30 min-h-screen max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-600" />
          Manajemen Karyawan & Gaji
        </h1>
        <p className="text-slate-500 mt-2 text-base font-medium">
          Daftarkan karyawan baru, kelola data staf, dan sesuaikan nominal gaji bulanan karyawan.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-fade-in text-base font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 animate-fade-in text-base font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Create Staff */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 lg:col-span-1">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 pb-4 border-b border-slate-100">
              <Plus className="w-5 h-5 text-indigo-600" />
              Daftarkan Karyawan Baru
            </h2>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Nama Karyawan</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap..."
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Email Akun</label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com..."
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Password (default: password123)..."
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Role / Jabatan</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <select
                    required
                    value={newStaff.roleId}
                    onChange={(e) => setNewStaff({ ...newStaff, roleId: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm cursor-pointer"
                  >
                    <option value="">Pilih Role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Gaji Bulanan (Rp)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    placeholder="e.g. 3000000"
                    value={newStaff.salary}
                    onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
              >
                Daftarkan Karyawan
              </button>
            </form>
          </div>

          {/* List Staff Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-2 space-y-6 p-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 pb-4 border-b border-slate-55">
              <Award className="w-5 h-5 text-indigo-600" />
              Daftar Seluruh Karyawan & Gaji
            </h2>

            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-sm">
                      <th className="py-4 px-3 font-semibold">Nama Karyawan</th>
                      <th className="py-4 px-3 font-semibold">Role</th>
                      <th className="py-4 px-3 font-semibold text-right">Gaji Bulanan</th>
                      <th className="py-4 px-3 font-semibold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-slate-700 text-base">
                        <td className="py-4 px-3">
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-sm text-slate-400 mt-0.5">{item.email}</div>
                        </td>
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.role?.name || 'No Role'}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-right font-bold text-slate-900">
                          {formatRupiah(item.salary)}
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingStaff(item);
                                setNewSalary(item.salary || 0);
                              }}
                              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-600 rounded-xl transition-all cursor-pointer"
                              title="Sesuaikan Gaji"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(item.id, item.name)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                              title="Keluarkan Karyawan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 italic">
                Belum ada data staff terdaftar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adjust Salary Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Sesuaikan Gaji Karyawan</h3>
              <p className="text-sm text-slate-400 mt-1">Ubah gaji untuk <strong>{editingStaff.name}</strong></p>
            </div>

            <form onSubmit={handleUpdateSalary} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Gaji Baru (Rp)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    required
                    placeholder="e.g. 4000000"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-bold transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer text-center"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
