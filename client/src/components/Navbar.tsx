import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';
import { useFriends } from '../stores/friends';
import { api } from '../lib/api';
import { audioPrefs } from '../lib/sounds';
import { useLang, useT } from '../lib/i18n';

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
        aria-label={prefs.muted ? 'Audio muted' : 'Audio settings'}
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
              type="range" min={0} max={100} value={Math.round(prefs.volume * 100)}
              onChange={e => audioPrefs.setVolume(Number(e.target.value) / 100)}
              disabled={prefs.muted}
              className="w-full accent-accent disabled:opacity-40"
            />
          </label>
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-xs text-ink-muted block mb-1.5 font-medium">Sound Pack</span>
            <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-surface-raised rounded-lg border border-border text-xs">
              <button
                type="button"
                onClick={() => audioPrefs.setSfxPack('classic')}
                disabled={prefs.muted}
                className={`py-1 rounded-md transition-all font-semibold ${
                  prefs.sfxPack === 'classic'
                    ? 'bg-surface-card text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink disabled:opacity-40'
                }`}
              >
                Classic
              </button>
              <button
                type="button"
                onClick={() => audioPrefs.setSfxPack('dombra')}
                disabled={prefs.muted}
                className={`py-1 rounded-md transition-all font-semibold flex items-center justify-center gap-1 ${
                  prefs.sfxPack === 'dombra'
                    ? 'bg-accent/15 text-accent shadow-sm border border-accent/25'
                    : 'text-ink-muted hover:text-ink disabled:opacity-40'
                }`}
              >
                <span>🎸 Dombra</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { requests, setRequests } = useFriends();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { lang, setLang } = useLang();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Poll pending friend requests every 30s when logged in
  useEffect(() => {
    if (!user) return;
    api.friends.requests().then(r => setRequests(r || [])).catch(() => {});
    const interval = setInterval(() => {
      api.friends.requests().then(r => setRequests(r || [])).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [user, setRequests]);

  const pendingCount = requests.length;

  const NAV_LINKS = [
    { to: '/play',        label: t('nav.play') },
    { to: '/leaderboard', label: t('nav.rankings') },
    { to: '/bosses',      label: t('nav.bossRush') },
    { to: '/puzzle',      label: t('nav.dailyPuzzle') },
    { to: '/shop',        label: t('nav.shop') },
  ];

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <nav className="bg-surface-nav border-b border-border sticky top-0 z-50" ref={menuRef}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 flex items-center justify-between gap-2">

        <Link to="/" className="font-display font-black text-lg text-ink hover:text-accent transition-colors tracking-tight shrink-0">
          Damka
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link key={to} to={to}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  active ? 'text-ink bg-surface-raised' : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side: lang toggle + audio + auth */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language toggle */}
          <div className="flex items-center rounded-md overflow-hidden border border-border text-xs font-bold">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 transition-colors ${lang === 'en' ? 'bg-surface-raised text-ink' : 'text-ink-faint hover:text-ink'}`}
            >EN</button>
            <button
              onClick={() => setLang('ru')}
              className={`px-2 py-1 transition-colors ${lang === 'ru' ? 'bg-surface-raised text-ink' : 'text-ink-faint hover:text-ink'}`}
            >RU</button>
          </div>

          <AudioSettings />

          {/* Friends icon (logged in only) */}
          {user && (
            <Link to="/friends" className="relative p-1.5 text-ink-muted hover:text-ink transition-colors rounded-md hover:bg-surface-raised" aria-label="Friends">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Link>
          )}

          {/* Desktop auth */}
          <div className="hidden sm:flex items-center gap-1.5">
            {user ? (
              <>
                <Link to={`/profile/${user.username}`}
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
                <button onClick={() => logout().then(() => nav('/'))}
                  className="text-xs text-ink-faint hover:text-danger transition-colors px-1.5"
                  aria-label="Sign out"
                >{t('nav.signOut')}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-xs py-1.5 px-3">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-xs py-1.5 px-3">{t('nav.signUp')}</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 text-ink-muted hover:text-ink transition-colors rounded-md hover:bg-surface-raised"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface-nav">
          <div className="max-w-6xl mx-auto px-3 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ to, label }) => {
              const active = pathname === to || (to !== '/' && pathname.startsWith(to));
              return (
                <Link key={to} to={to}
                  className={`px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    active ? 'text-ink bg-surface-raised' : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            {user && (
              <Link to="/friends"
                className={`px-3 py-2.5 text-sm font-medium rounded-md transition-colors flex items-center justify-between ${
                  pathname === '/friends' ? 'text-ink bg-surface-raised' : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
                }`}
              >
                <span>Friends</span>
                {pendingCount > 0 && (
                  <span className="bg-accent text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
            <div className="border-t border-border mt-2 pt-2">
              {user ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <Link to={`/profile/${user.username}`}
                    className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent"
                  >
                    <span className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-black text-accent">
                      {user.username[0]?.toUpperCase()}
                    </span>
                    {user.username}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-coin bg-surface-raised border border-border px-2 py-1 rounded-md">
                      {user.coins}c
                    </span>
                    <button onClick={() => logout().then(() => nav('/'))}
                      className="text-xs text-ink-faint hover:text-danger transition-colors"
                    >{t('nav.signOut')}</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 px-1">
                  <Link to="/login" className="btn-secondary text-sm py-2 flex-1 text-center">{t('nav.login')}</Link>
                  <Link to="/register" className="btn-primary text-sm py-2 flex-1 text-center">{t('nav.signUp')}</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
