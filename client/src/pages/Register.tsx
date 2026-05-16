import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';

const CITIES = ['Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz', 'Pavlodar', 'Other'];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', city: 'Almaty' });
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try { await register(form); nav('/play'); }
    catch (err: any) { setError(err.error || 'Registration failed'); }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">♟</div>
        <h1 className="text-2xl font-black text-ink">Join Damka</h1>
        <p className="text-ink-muted text-sm mt-1">Start with 500 coins</p>
      </div>
      <div className="card">
        {error && <p className="text-danger text-sm mb-4 bg-danger/10 border border-danger/20 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Username" value={form.username}
            onChange={e => setForm({...form, username: e.target.value})} className="input" />
          <input type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} className="input" />
          <input type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} className="input" />
          <select value={form.city} onChange={e => setForm({...form, city: e.target.value})}
            className="input bg-surface-nav">
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="btn-primary w-full mt-2">Create Account</button>
        </form>
        <p className="text-center text-sm text-ink-muted mt-4">
          Have an account? <Link to="/login" className="text-accent hover:underline font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
}
