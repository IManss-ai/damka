import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';

const NAV_LINKS = [
  { to: '/play',        label: 'Play',          icon: '⚔️' },
  { to: '/leaderboard', label: 'Rankings',       icon: '🏆' },
  { to: '/bosses',      label: 'Boss Rush',      icon: '👹' },
  { to: '/puzzle',      label: 'Daily Puzzle',   icon: '🧩' },
  { to: '/shop',        label: 'Shop',           icon: '🛒' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bg-surface-nav border-b border-border sticky top-0 z-50" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="max-w-7xl mx-auto px-4 h-13 flex items-center justify-between" style={{ height: 52 }}>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display font-black text-xl text-ink hover:text-accent transition-colors group">
          <span className="text-2xl group-hover:animate-bounce inline-block">♟️</span>
          <span className="tracking-tight">Damka</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ to, label, icon }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  active
                    ? 'text-accent bg-accent/10 border border-accent/20'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-raised border border-transparent'
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* User area */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-2 bg-surface-raised border border-border rounded-lg px-3 py-1.5 hover:border-accent/40 transition-all group"
              >
                <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-black text-accent">
                  {user.username[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">{user.username}</span>
                <span className="flex items-center gap-1 text-xs font-bold text-coin">
                  &#9679; {user.coins}
                </span>
              </Link>
              <button
                onClick={() => logout().then(() => nav('/'))}
                className="text-xs text-ink-faint hover:text-danger transition-colors px-2 py-1.5"
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
