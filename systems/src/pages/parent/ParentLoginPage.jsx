import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
import api from '../axios';
import { Shield, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

export default function ParentLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/parent/login`;
      // const res = await axios.post(url, { email, password });
      const res = await api.post('/api/parent/login', { email, password });

      // Store token and parent data separate from admin auth
      localStorage.setItem('parentToken', res.data.access_token);
      localStorage.setItem('parentProfile', JSON.stringify(res.data.parent));

      navigate('/parent/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob" />
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000" />

      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl space-y-6 relative z-10">

        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-650 flex items-center justify-center mx-auto text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Parent Portal</h2>
          <p className="text-xs text-slate-400">Pantau perkembangan akademis & jadwalkan kelas anak Anda.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Orang Tua</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                placeholder="ortu@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-sm transition-all duration-200"
          >
            {loading ? 'Masuk...' : 'Masuk Portal'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-indigo-400 hover:underline font-semibold"
          >
            Masuk sebagai Administrator Staf
          </button>
        </div>

      </div>
    </div>
  );
}
