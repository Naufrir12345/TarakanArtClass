import { useState, useEffect } from 'react';
import api from '../api/axios';
import { CloudLightning, CheckCircle2, XCircle, RefreshCw, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export default function AccurateIntegrationPage() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, logsRes] = await Promise.all([
        api.get('/api/accurate/status'),
        api.get('/api/accurate/logs'),
      ]);
      setStatus(statusRes.data);
      setLogs(logsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat status integrasi Accurate.');
      setLoading(false);
    }
  };

  const handleConnectAccurate = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/accurate/connect-url');
      window.location.href = res.data.url;
    } catch (err) {
      setError('Gagal mendapatkan url login Accurate.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Integrasi Accurate Online</h1>
          <p className="text-sm text-slate-500">Koneksikan pembukuan Manufindo LES System secara otomatis dengan Accurate Online Accounting.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-655 rounded-xl transition-colors"
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
          
          {/* Connection Status Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CloudLightning size={20} className="text-indigo-650" />
                Status Koneksi
              </h3>

              <div className="flex flex-col items-center justify-center py-6 border border-slate-100 rounded-2xl space-y-3 bg-slate-50/50">
                {status?.connected ? (
                  <>
                    <CheckCircle2 size={48} className="text-emerald-500" />
                    <div className="text-center">
                      <p className="font-bold text-slate-800 text-sm">Terhubung dengan Accurate</p>
                      {status.isMock && <p className="text-[10px] text-indigo-500 font-bold uppercase mt-0.5">MOCK INTEGRATION MODE</p>}
                      <p className="text-xs text-slate-400 mt-1">
                        Token aktif s/d: {new Date(status.expiresAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={48} className="text-slate-400" />
                    <div className="text-center">
                      <p className="font-bold text-slate-850 text-sm">Belum Terhubung</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Sambungkan akun untuk mengaktifkan sinkronisasi otomatis harian.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleConnectAccurate}
                className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors text-center block ${
                  status?.connected
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {status?.connected ? 'Hubungkan Kembali' : 'Hubungkan Accurate Online'}
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Informasi Integrasi</h4>
              <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside">
                <li>Sinkronisasi data dilakukan secara otomatis setiap pukul 00:00 WIB.</li>
                <li>Hanya Invoice dengan status pembayaran <strong className="text-emerald-650">PAID</strong> yang disinkronkan ke Accurate.</li>
                <li>Setiap sync mencatat log request dan response dari API Accurate untuk mempermudah monitoring audit.</li>
              </ul>
            </div>
          </div>

          {/* Sync History Log List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg">Log Sinkronisasi Accurate</h3>
                <p className="text-xs text-slate-400">Riwayat pengiriman jurnal invoice tagihan & biaya operasional ke Accurate.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Waktu Sync</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Tipe Data</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">ID Referensi</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Keterangan / Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-xs font-bold font-mono text-slate-700">{log.syncType}</td>
                        <td className="p-4 text-xs font-mono text-slate-400 truncate max-w-[100px]">{log.referenceId}</td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700'
                                : log.status === 'FAILED'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-500 max-w-xs truncate">
                          {log.status === 'FAILED' ? log.errorLog : 'Synced successfully'}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                          Belum ada riwayat sinkronisasi data ke Accurate.
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
