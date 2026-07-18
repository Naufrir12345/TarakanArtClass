import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Eye, Search, Filter, RefreshCw, AlertCircle, FileText } from 'lucide-react';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [action, setAction] = useState('');
  const [targetTable, setTargetTable] = useState('');
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState([]);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, [currentPage, action, targetTable, userId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/activity-log', {
        params: {
          page: currentPage,
          limit: 15,
          action,
          targetTable,
          userId,
        },
      });
      setLogs(res.data.data);
      setTotalPages(res.data.meta?.totalPages || res.data.totalPages || 1);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat log aktivitas.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/roles/users'); // Reuse users endpoint
      setUsers(res.data || []);
    } catch (err) {
      // Ignored
    }
  };

  const handleResetFilters = () => {
    setAction('');
    setTargetTable('');
    setUserId('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Log Aktivitas Sistem</h1>
          <p className="text-sm text-slate-500">Audit trail semua operasi mutasi (Create, Update, Delete) yang dilakukan oleh pengguna.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
          title="Refresh Log"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-150">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Filter Aksi</label>
          <select
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Semua Aksi</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Filter Modul / Tabel</label>
          <input
            type="text"
            placeholder="e.g. Student, Invoice"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            value={targetTable}
            onChange={(e) => {
              setTargetTable(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Filter Staf</label>
          <select
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Semua Staf</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={handleResetFilters}
            className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Logs Table */}
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
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Waktu</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Pengguna / Staf</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Aksi</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Modul / Tabel</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">ID Target</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actionColor =
                    log.action === 'CREATE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : log.action === 'UPDATE'
                      ? 'bg-amber-50 text-amber-700'
                      : log.action === 'DELETE'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-indigo-50 text-indigo-700';

                  return (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-800">
                        {log.user?.name || 'System / Unknown'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${actionColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-600">{log.targetTable}</td>
                      <td className="p-4 text-xs font-mono text-slate-400 truncate max-w-[120px]">{log.targetId || '-'}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                      Tidak ada log audit yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                  className="px-3 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:pointer-events-none rounded-lg text-xs font-semibold transition-colors"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                  className="px-3 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:pointer-events-none rounded-lg text-xs font-semibold transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <FileText size={20} className="text-indigo-600" />
              <h3 className="font-bold text-lg">Detail Audit Log</h3>
            </div>
            
            <div className="text-xs space-y-2">
              <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                <span className="font-bold text-slate-500">Waktu</span>
                <span className="col-span-2 text-slate-700">{new Date(selectedLog.timestamp).toLocaleString('id-ID')}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                <span className="font-bold text-slate-500">User / Pelaku</span>
                <span className="col-span-2 text-slate-700">{selectedLog.user?.name} ({selectedLog.user?.email})</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                <span className="font-bold text-slate-500">Aksi / Operasi</span>
                <span className="col-span-2 font-semibold text-slate-700">{selectedLog.action}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                <span className="font-bold text-slate-500">Tabel Target</span>
                <span className="col-span-2 font-mono text-slate-700">{selectedLog.targetTable}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                <span className="font-bold text-slate-500">ID Dokumen</span>
                <span className="col-span-2 font-mono text-slate-700">{selectedLog.targetId || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="block font-bold text-slate-500">Payload / Data Detail</span>
                <pre className="bg-slate-550/10 p-3 rounded-xl border border-slate-200 text-[10px] font-mono overflow-x-auto max-h-48 text-slate-700">
                  {selectedLog.details ? JSON.stringify(JSON.parse(selectedLog.details), null, 2) : 'Tidak ada payload data.'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
