import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Shield, Key, UserCheck, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

export default function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [newPermissionAction, setNewPermissionAction] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  // Assign role form
  const [assignUser, setAssignUser] = useState({ userId: '', roleId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permRes, usersRes] = await Promise.all([
        api.get('/api/roles'),
        api.get('/api/roles/permissions'),
        api.get('/api/roles/users'), // We will mock/add this endpoint in auth controller if needed, or get users list. Let's make it robust!
      ]);
      setRoles(rolesRes.data);
      setPermissions(permRes.data);
      setUsers(usersRes.data || []);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat konfigurasi hak akses/role.');
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName) return;
    try {
      await api.post('/api/roles', { name: newRoleName.toUpperCase() });
      setSuccess(`Role ${newRoleName} berhasil dibuat!`);
      setNewRoleName('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat role.');
    }
  };

  const handleCreatePermission = async (e) => {
    e.preventDefault();
    if (!newPermissionAction) return;
    try {
      await api.post('/api/roles/permissions', { action: newPermissionAction.toUpperCase() });
      setSuccess(`Permission ${newPermissionAction} berhasil dibuat!`);
      setNewPermissionAction('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat permission.');
    }
  };

  const handleTogglePermission = async (roleId, permissionId, hasPermission) => {
    try {
      if (hasPermission) {
        // Revoke
        await api.patch(`/api/roles/${roleId}/permissions/revoke`, { permissionId });
      } else {
        // Assign
        await api.patch(`/api/roles/${roleId}/permissions/assign`, { permissionId });
      }
      setSuccess('Hak akses berhasil diperbarui!');
      fetchData();
    } catch (err) {
      setError('Gagal memperbarui hak akses.');
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!assignUser.userId || !assignUser.roleId) return;
    try {
      await api.post('/api/roles/assign-user', assignUser);
      setSuccess('Role berhasil diberikan kepada user!');
      setAssignUser({ userId: '', roleId: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memberikan role ke user.');
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Hapus role ini? User dengan role ini mungkin kehilangan akses.')) return;
    try {
      await api.delete(`/api/roles/${id}`);
      setSuccess('Role berhasil dihapus.');
      fetchData();
    } catch (err) {
      setError('Gagal menghapus role.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Role & Hak Akses</h1>
        <p className="text-sm text-slate-500">Kelola otorisasi admin, hak akses sistem (Permissions), dan pengelompokan role.</p>
      </div>

      {/* Notifications */}
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Panel: Manage Roles & Add */}
          <div className="space-y-6 lg:col-span-1">

            {/* Create Role Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Shield size={18} className="text-indigo-600" />
                Tambah Role Baru
              </h3>
              <form onSubmit={handleCreateRole} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. TEACHER, FINANCE"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm uppercase"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <Plus size={16} />
                </button>
              </form>
            </div>

            {/* Create Permission Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Key size={18} className="text-indigo-600" />
                Tambah Permission Baru
              </h3>
              <form onSubmit={handleCreatePermission} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. EDIT_STUDENT, VIEW_LOGS"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm uppercase"
                  value={newPermissionAction}
                  onChange={(e) => setNewPermissionAction(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <Plus size={16} />
                </button>
              </form>
            </div>

            {/* Assign Role to User Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserCheck size={18} className="text-indigo-600" />
                Assign Role ke User
              </h3>
              <form onSubmit={handleAssignRole} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">User / Staf</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={assignUser.userId}
                    onChange={(e) => setAssignUser({ ...assignUser, userId: e.target.value })}
                  >
                    <option value="">-- Pilih Staf --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role?.name || 'BELUM ADA ROLE'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Role</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    value={assignUser.roleId}
                    onChange={(e) => setAssignUser({ ...assignUser, roleId: e.target.value })}
                  >
                    <option value="">-- Pilih Role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Simpan Otorisasi
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel: Roles Grid & Permission Checklist */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg">Matrix Hak Akses & Role</h3>
                <p className="text-xs text-slate-400">Atur hak akses secara real-time dengan men-checklist izin per role.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Permission / Action</th>
                      {roles.map((role) => (
                        <th key={role.id} className="p-4 text-xs font-bold text-slate-700 uppercase text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span>{role.name}</span>
                            {role.name !== 'ADMIN' && (
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="text-[10px] text-red-500 hover:underline"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((perm) => (
                      <tr key={perm.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-4 font-mono text-xs text-slate-700 font-semibold">{perm.action}</td>
                        {roles.map((role) => {
                          const hasPermission = role.permissions.some((p) => p.id === perm.id);
                          return (
                            <td key={role.id} className="p-4 text-center">
                              <input
                                type="checkbox"
                                disabled={role.name === 'ADMIN'} // Admin possesses all scopes implicitly
                                checked={role.name === 'ADMIN' || hasPermission}
                                onChange={() => handleTogglePermission(role.id, perm.id, hasPermission)}
                                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {permissions.length === 0 && (
                      <tr>
                        <td colSpan={roles.length + 1} className="p-8 text-center text-sm text-slate-400">
                          Belum ada permission terdaftar. Silakan tambah di panel kiri.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
