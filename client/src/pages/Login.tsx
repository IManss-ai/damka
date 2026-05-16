import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try { await login(form.email, form.password); nav('/play'); }
    catch (err: any) { setError(err.error || 'Login failed'); }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">♟</div>
        <h1 className="text-2xl font-black text-ink">Welcome back</h1>
        <p className="text-ink-muted text-sm mt-1">Sign in to your Damka account</p>
      </div>
      <div className="card">
        {error && <p className="text-danger text-sm mb-4 bg-danger/10 border border-danger/20 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="input" />
          <input type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="input" />
          <button type="submit" className="btn-primary w-full mt-2">Sign In</button>
        </form>
        <p className="text-center text-sm text-ink-muted mt-4">
          No account? <Link to="/register" className="text-accent hover:underline font-semibold">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
