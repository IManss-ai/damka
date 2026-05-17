import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';
import { audioPrefs } from '../lib/sounds';

const NAV_LINKS = [
  { to: '/play',        label: 'Play' },
  { to: '/leaderboard', label: 'Rankings' },
  { to: '/bosses',      label: 'Boss Rush' },
  { to: '/puzzle',      label: 'Daily Puzzle' },
  { to: '/shop',        label: 'Shop' },
];

function AudioSettings() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(audioPrefs.get());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = audioPrefs.subscribe(setPrefs);
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const speakerIcon = prefs.muted ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M11 5L6 9H2v6h4l5 4z" /><path d="M22 9l-6 6M16 9l6 6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M11 5L6 9H2v6h4l5 4z" /><path d="M15.5 12a3.5 3.5 0 0 0-1.5-2.9" /><path d="M19 12a7 7 0 0 0-3-5.7" />
    </svg>
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-ink-muted hover:text-ink transition-colors p-1.5 rounded-md hover:bg-surface-raised"
        aria-label={prefs.muted ? 'Audio muted, open audio settings' : 'Open audio settings'}
      >
        {speakerIcon}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-card border border-border rounded-xl p-4 shadow-2xl z-50">
          <p className="section-title mb-3">Audio</p>
          <button
            onClick={() => audioPrefs.toggleMute()}
            className={`w-full text-left py-2 px-3 rounded-md text-sm flex items-center justify-between transition-colors mb-3 ${
              prefs.muted ? 'bg-danger/10 text-danger border border-danger/30' : 'bg-surface-raised text-ink-muted hover:text-ink'
            }`}
          >
            <span>{prefs.muted ? 'Muted' : 'Sound on'}</span>
            <span className="text-xs">{prefs.muted ? 'Click to unmute' : 'Click to mute'}</span>
          </button>
          <label className="block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-ink-muted">Volume</span>
              <span className="text-xs font-mono text-ink-faint">{Math.round(prefs.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(prefs.volume * 100)}
              onChange={e => audioPrefs.setVolume(Number(e.target.value) / 100)}
              disabled={prefs.muted}
              className="w-full accent-accent disabled:opacity-40"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bg-surface-nav border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 flex items-center justify-between gap-2">

        <Link to="/" className="font-display font-black text-lg text-ink hover:text-accent transition-colors tracking-tight shrink-0">
          Damka
        </Link>

        {/* Center nav — horizontal scroll on mobile, flex on desktop */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin min-w-0 flex-1 justify-center">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
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

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <AudioSettings />
          {user ? (
            <>
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-black text-accent">
                  {user.username[0]?.toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.username}</span>
              </Link>
              <span className="text-xs font-bold text-coin bg-surface-raised border border-border px-2 py-1 rounded-md whitespace-nowrap">
                {user.coins}c
              </span>
              <button
                onClick={() => logout().then(() => nav('/'))}
                className="text-xs text-ink-faint hover:text-danger transition-colors px-1.5"
                aria-label="Sign out"
              >
                out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-xs sm:text-sm py-1.5 px-3 sm:px-4">Login</Link>
              <Link to="/register" className="btn-primary text-xs sm:text-sm py-1.5 px-3 sm:px-4">Sign Up</Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
