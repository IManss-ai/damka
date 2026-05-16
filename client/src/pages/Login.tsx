import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../stores/auth';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await login(form.email, form.password); nav('/play'); }
    catch (err: any) { setError(err.error || 'Login failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="hero-gradient fixed inset-0 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-float inline-block">♟️</div>
          <h1 className="font-display text-2xl font-black text-ink">Welcome back</h1>
          <p className="text-ink-muted text-sm mt-1">Sign in to continue your rivalry</p>
        </div>
        <div className="card-glow">
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-danger text-sm mb-4 bg-danger/10 border border-danger/25 p-3 rounded-lg"
            >{error}</motion.p>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-ink-muted block mb-1.5">Email</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input" autoComplete="email" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted block mb-1.5">Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-ink-muted mt-5">
            No account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover font-semibold transition-colors">
              Sign up free →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
