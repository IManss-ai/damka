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
    <nav className="bg-surface-nav border-b border-surface-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-black text-lg text-ink hover:text-accent transition-colors">
          <span className="text-xl">♟</span>
          <span>Damka</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                pathname.startsWith(to)
                  ? 'text-ink bg-surface-raised'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* User area */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="flex items-center gap-1 text-xs font-bold text-coin bg-surface-raised px-3 py-1.5 rounded-md border border-surface-border">
                &#9679; {user.coins}
              </span>
              <Link
                to={`/profile/${user.username}`}
                className="text-sm font-semibold text-ink hover:text-accent transition-colors"
              >
                {user.username}
              </Link>
              <button
                onClick={() => logout().then(() => nav('/'))}
                className="text-xs text-ink-faint hover:text-danger transition-colors"
              >
                logout
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
