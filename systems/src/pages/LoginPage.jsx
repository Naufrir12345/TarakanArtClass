import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-700" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-md shadow-indigo-200 mb-3">
            M
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Selamat Datang</h2>
          <p className="text-sm text-slate-500 mt-1">Web Master Les Anak-Anak Manufindo</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@manufindo.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold transition-all shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 mt-8"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk Ke Dashboard</span>
            )}
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Belum punya akun?{' '}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
              Daftar Sekarang
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
