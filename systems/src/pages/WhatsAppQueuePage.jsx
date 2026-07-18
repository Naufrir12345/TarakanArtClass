import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Send, RefreshCw, MessageSquare, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function WhatsAppQueuePage() {
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchWhatsAppQueue = async () => {
        try {
            setError(null);
            const res = await api.get('/api/wa-queue');
            setQueues(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Gagal mengambil data antrean WA:", err);
            setError("Gagal memuat data antrean WhatsApp. Pastikan Anda telah masuk.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWhatsAppQueue();
    }, []);

    const handleTriggerReminders = async () => {
        setActionLoading(true);
        try {
            const res = await api.post('/api/wa-queue/trigger-reminders');
            alert(res.data.message);
            await fetchWhatsAppQueue();
        } catch (err) {
            console.error("Gagal memicu reminder kelas:", err);
            alert("Gagal memicu pembuatan reminder: " + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleTriggerH1 = async () => {
        setActionLoading(true);
        try {
            const res = await api.post('/api/wa-queue/trigger-h1');
            alert(res.data.message);
            await fetchWhatsAppQueue();
        } catch (err) {
            console.error("Gagal memicu reminder H-1 kelas:", err);
            alert("Gagal memicu pembuatan reminder H-1: " + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleProcessQueue = async () => {
        setActionLoading(true);
        try {
            const res = await api.post('/api/wa-queue/process');
            alert(res.data.message);
            await fetchWhatsAppQueue();
        } catch (err) {
            console.error("Gagal memproses antrean:", err);
            alert("Gagal mengirim pesan: " + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const pendingCount = queues.filter(q => q.status === 'PENDING').length;
    const sentCount = queues.filter(q => q.status === 'SENT').length;
    const failedCount = queues.filter(q => q.status === 'FAILED').length;

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">Memuat data antrean WA...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Antrean WhatsApp</h1>
                    <p className="text-slate-500 mt-2 text-base font-medium">Kelola dan kirim pengingat jadwal les otomatis kepada orang tua siswa.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchWhatsAppQueue}
                        disabled={actionLoading}
                        className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition-all"
                        title="Segarkan Antrean"
                    >
                        <RefreshCw size={18} className={actionLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleTriggerReminders}
                        disabled={actionLoading}
                        className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-semibold transition-all"
                    >
                        Generate Reminder Hari Ini
                    </button>
                    <button
                        onClick={handleTriggerH1}
                        disabled={actionLoading}
                        className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-sm font-semibold transition-all"
                    >
                        Generate Reminder H-1 (Besok)
                    </button>
                    <button
                        onClick={handleProcessQueue}
                        disabled={actionLoading || pendingCount === 0}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
                    >
                        <Send size={16} />
                        <span>Kirim Semua Antrean</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm text-sm">
                    {error}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-black uppercase tracking-wider">Antrean Pending</p>
                        <h2 className="text-3xl font-extrabold text-slate-800 mt-1">{pendingCount}</h2>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                </div>
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-black uppercase tracking-wider">Berhasil Terkirim</p>
                        <h2 className="text-3xl font-extrabold text-slate-800 mt-1">{sentCount}</h2>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-black uppercase tracking-wider">Gagal Kirim</p>
                        <h2 className="text-3xl font-extrabold text-slate-800 mt-1">{failedCount}</h2>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                        <AlertCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Queue List */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare size={20} className="text-indigo-600" />
                        <span>Daftar Pesan Pengingat</span>
                    </h3>
                </div>

                <div className="divide-y divide-slate-100">
                    {queues.length > 0 ? (
                        queues.map((q) => (
                            <div key={q.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-lg text-indigo-950">{q.phoneNumber}</p>
                                        {q.student && (
                                            <span className="text-sm font-bold px-3 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                                                Ortu: {q.student.namaAnak}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-base text-slate-700 max-w-3xl leading-relaxed">{q.message}</p>
                                    {q.errorLog && (
                                        <p className="text-sm text-rose-500 font-semibold">Error: {q.errorLog}</p>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-extrabold ${
                                        q.status === 'SENT' ? 'bg-emerald-50 text-emerald-700' :
                                        q.status === 'FAILED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {q.status}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {new Date(q.scheduledAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-slate-400 italic">
                            Tidak ada pesan dalam antrean saat ini.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}