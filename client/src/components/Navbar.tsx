import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';

const NAV_LINKS = [
  { to: '/play',        label: 'Play' },
  { to: '/leaderboard', label: 'Rankings' },
  { to: '/bosses',      label: 'Boss Rush' },
  { to: '/puzzle',      label: 'Daily Puzzle' },
  { to: '/shop',        label: 'Shop' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bg-surface-nav border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">

        <Link to="/" className="font-display font-black text-lg text-ink hover:text-accent transition-colors tracking-tight">
          Damka
        </Link>

        <div className="flex items-center gap-0.5">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  active
                    ? 'text-ink bg-surface-raised'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-black text-accent">
                  {user.username[0]?.toUpperCase()}
                </span>
                {user.username}
              </Link>
              <span className="text-xs font-bold text-coin bg-surface-raised border border-border px-2.5 py-1 rounded-md">
                {user.coins}c
              </span>
              <button
                onClick={() => logout().then(() => nav('/'))}
                className="text-xs text-ink-faint hover:text-danger transition-colors px-2"
              >
                out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm py-1.5 px-4">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-4">Sign Up</Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
