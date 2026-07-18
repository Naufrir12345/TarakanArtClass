import { useState, useEffect } from 'react';
import api from '../api/axios';
import { PlusCircle, ArrowUpRight, ArrowDownRight, Wallet, Loader2, Calendar } from 'lucide-react';

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    note?: string;
    date: string;
}

interface SummaryData {
    totalIncome: number;
    totalExpense: number;
}

export default function KeuanganPage() {
    const [summary, setSummary] = useState<SummaryData>({ totalIncome: 0, totalExpense: 0 });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [type, setType] = useState<'income' | 'expense'>('income');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setError(null);
            const [summaryRes, transactionsRes] = await Promise.all([
                api.get('/api/finance/summary'),
                api.get('/api/finance/transactions')
            ]);
            setSummary(summaryRes.data);
            setTransactions(transactionsRes.data);
        } catch (err) {
            console.error("Gagal mengambil data keuangan:", err);
            setError("Gagal memuat data keuangan. Pastikan Anda telah masuk (login) dan API aktif.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !category) return;

        setSubmitting(true);
        try {
            const payload = {
                amount: Number(amount),
                category,
                note,
                date: new Date().toISOString()
            };

            if (type === 'income') {
                await api.post('/api/finance/income', payload);
            } else {
                await api.post('/api/finance/expense', payload);
            }

            // Reset form
            setAmount('');
            setCategory('');
            setNote('');
            
            // Refresh data
            await fetchData();
        } catch (err) {
            console.error("Gagal menyimpan transaksi:", err);
            alert("Gagal menyimpan transaksi.");
        } finally {
            setSubmitting(false);
        }
    };

    const saldo = summary.totalIncome - summary.totalExpense;

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-slate-500 font-medium">Memuat data keuangan...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manajemen Keuangan</h1>
                <p className="text-slate-500 mt-1.5 text-sm md:text-base">Pantau arus kas pemasukan, pengeluaran, serta catat transaksi baru dengan mudah.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <p className="text-emerald-800 text-sm font-bold uppercase tracking-wider">Total Pemasukan</p>
                        <h2 className="text-3xl font-black text-emerald-950 mt-1.5">
                            Rp {summary.totalIncome.toLocaleString('id-ID')}
                        </h2>
                    </div>
                    <div className="p-4 bg-emerald-100 text-emerald-700 rounded-xl">
                        <ArrowUpRight size={26} />
                    </div>
                </div>

                <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <p className="text-rose-800 text-sm font-bold uppercase tracking-wider">Total Pengeluaran</p>
                        <h2 className="text-3xl font-black text-rose-950 mt-1.5">
                            Rp {summary.totalExpense.toLocaleString('id-ID')}
                        </h2>
                    </div>
                    <div className="p-4 bg-rose-100 text-rose-700 rounded-xl">
                        <ArrowDownRight size={26} />
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <p className="text-indigo-800 text-sm font-bold uppercase tracking-wider">Selisih (Saldo)</p>
                        <h2 className={`text-3xl font-black mt-1.5 ${saldo >= 0 ? 'text-indigo-950' : 'text-rose-950'}`}>
                            Rp {saldo.toLocaleString('id-ID')}
                        </h2>
                    </div>
                    <div className="p-4 bg-indigo-100 text-indigo-700 rounded-xl">
                        <Wallet size={26} />
                    </div>
                </div>
            </div>

            {/* Form & Table Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Catat Transaksi */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-5">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <PlusCircle size={22} className="text-indigo-600" />
                        <span>Catat Transaksi</span>
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Type Toggle */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipe Transaksi</label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setType('income')}
                                    className={`py-2.5 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                                >
                                    Pemasukan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('expense')}
                                    className={`py-2.5 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                                >
                                    Pengeluaran
                                </button>
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Jumlah (Rp)</label>
                            <input
                                type="number"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Contoh: 100000"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Kategori</label>
                            <input
                                type="text"
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Contoh: SPP Bulanan, Sewa Gedung, dll"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-base text-slate-800 shadow-sm"
                            />
                        </div>

                        {/* Note */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Catatan (Opsional)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Keterangan tambahan..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-base text-slate-800 h-28 resize-none shadow-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-base font-bold transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                            <span>Simpan Transaksi</span>
                        </button>
                    </form>
                </div>

                {/* Riwayat Transaksi */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-5">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={22} className="text-slate-600" />
                        <span>Riwayat Transaksi Terkini</span>
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-sm font-bold uppercase tracking-wider">
                                    <th className="pb-3.5 font-semibold">Tanggal</th>
                                    <th className="pb-3.5 font-semibold">Kategori</th>
                                    <th className="pb-3.5 font-semibold">Tipe</th>
                                    <th className="pb-3.5 font-semibold text-right">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm md:text-base">
                                {transactions.length > 0 ? (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 text-slate-500">
                                                {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="py-4 font-semibold text-slate-800">
                                                <div>{tx.category}</div>
                                                {tx.note && <div className="text-xs md:text-sm text-slate-400 font-normal mt-0.5">{tx.note}</div>}
                                            </td>
                                            <td className="py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                    {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                                </span>
                                            </td>
                                            <td className={`py-4 text-right font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-slate-400 italic">
                                            Belum ada transaksi tercatat.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}