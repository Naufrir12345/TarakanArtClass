import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import axios from 'axios';
import api from '..src/api/axios';
import { Lock, Mail, User, Loader2 } from 'lucide-react';

export default function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            // Pastikan URL sesuai dengan backend Anda
            await api.post('/api/auth/register', {
                name,
                email,
                password,
                role: 'ADMIN' // Sesuaikan role jika perlu
            });
            alert('Registrasi berhasil! Silakan login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-700" />

            <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-xl relative z-10 bg-white/80 backdrop-blur-lg border border-white/50">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">Buat Akun Baru</h2>
                    <p className="text-sm text-slate-500 mt-1">Daftarkan akun Admin Manufindo</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-5">
                    {/* Input Nama */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Nama Lengkap</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><User size={18} /></span>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none transition-all" />
                        </div>
                    </div>

                    {/* Input Email */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Mail size={18} /></span>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@manufindo.com" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none transition-all" />
                        </div>
                    </div>

                    {/* Input Password */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Lock size={18} /></span>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none transition-all" />
                        </div>
                    </div>

                    <button type="submit" disabled={submitting} className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 mt-8">
                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <span>Daftar Sekarang</span>}
                    </button>

                    <p className="text-center text-sm text-slate-500 mt-4">
                        Sudah punya akun? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Masuk di sini</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}