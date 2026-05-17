import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface-nav mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-faint">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-ink-muted text-sm tracking-tight">Damka</span>
          <span className="text-ink-faint">·</span>
          <span>Russian checkers, taken seriously.</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/IManss-ai/damka"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink-muted transition-colors"
          >
            GitHub
          </a>
          <Link to="/pro" className="hover:text-ink-muted transition-colors">Pro</Link>
          <Link to="/leaderboard" className="hover:text-ink-muted transition-colors">Rankings</Link>
          <span className="text-ink-faint">© {year}</span>
        </div>
      </div>
    </footer>
  );
}
