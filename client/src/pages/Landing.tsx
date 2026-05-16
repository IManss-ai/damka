import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSocket } from '../lib/socket';
import { api } from '../lib/api';

const FEATURES = [
  { sym: '◈', title: 'AI Coach', desc: 'After every game, Claude analyzes your moves and tells you exactly where you won or lost it.' },
  { sym: '⚔', title: 'Live Multiplayer', desc: 'Real-time games over WebSockets. Share a link, your opponent joins in seconds.' },
  { sym: '★', title: 'Boss Rush', desc: '5 AI opponents, each harder than the last. Beat The Grandmaster to prove yourself.' },
  { sym: '◉', title: 'City Rivalries', desc: 'Every win earns points for your city. Almaty vs Astana — the board is yours.' },
  { sym: '◆', title: 'Daily Puzzle', desc: 'One forced-capture puzzle per day. Solve it faster than everyone else.' },
  { sym: '◎', title: 'Cosmetics', desc: 'Earn coins, buy piece skins and board themes. Stand out at the table.' },
];

export default function Landing() {
  const [liveGames, setLiveGames] = useState<any[]>([]);
  const [cityScores, setCityScores] = useState<any[]>([]);
  const [globalCount, setGlobalCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('lobby:join');
    socket.on('lobby:games', (games: any[]) => setLiveGames(games));
    socket.on('lobby:gameCreated', (g: any) => setLiveGames(p => [g, ...p].slice(0, 5)));
    socket.on('lobby:gameEnded', ({ gameId }: any) => setLiveGames(p => p.filter((g: any) => g.id !== gameId)));
    api.leaderboard.city().then(setCityScores).catch(() => {});
    api.leaderboard.global().then((players: any[]) => setGlobalCount(players.length)).catch(() => {});
    return () => {
      socket.off('lobby:games');
      socket.off('lobby:gameCreated');
      socket.off('lobby:gameEnded');
    };
  }, []);

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent border border-accent/30 bg-accent/8 px-4 py-1.5 rounded-full mb-10 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {globalCount > 0 ? `${globalCount} players on the platform` : 'Open beta — free to play'}
            </div>

            <h1 className="font-display text-6xl md:text-7xl font-black text-ink mb-5 tracking-tight leading-none">
              Damka
            </h1>
            <p className="text-xl text-ink-muted max-w-md mx-auto mb-2 leading-relaxed">
              Competitive checkers with real stakes.
            </p>
            <p className="text-sm text-ink-faint mb-12">
              AI coaching · city rivalries · live multiplayer · boss campaign
            </p>

            <div className="flex gap-3 justify-center">
              <Link to="/register" className="btn-primary px-10 py-3 text-base">
                Play Free
              </Link>
              <Link to="/leaderboard" className="btn-secondary px-8 py-3">
                Rankings
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Live stats bar */}
      <div className="border-b border-border bg-surface-nav">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-8 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-ink-muted font-medium">
              {liveGames.length > 0 ? `${liveGames.length} game${liveGames.length > 1 ? 's' : ''} live` : 'No games now'}
            </span>
          </div>
          <div className="text-xs text-ink-faint">|</div>
          <div className="text-xs text-ink-muted font-medium shrink-0">{globalCount} ranked players</div>
          <div className="text-xs text-ink-faint">|</div>
          <div className="text-xs text-ink-muted font-medium shrink-0">Season 1 active</div>
          {liveGames.slice(0, 3).map((g: any) => (
            <Link key={g.id} to={`/game/${g.id}`}
              className="text-xs text-ink-faint hover:text-ink transition-colors shrink-0 font-mono">
              {g.whiteUsername} vs {g.blackUsername || '...'}
            </Link>
          ))}
        </div>
      </div>

      {/* City rivalry + live games */}
      <div className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-6">
        {/* City table */}
        <div>
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">City Rivalry — This Week</h2>
          <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
            {cityScores.length === 0 ? (
              <div className="px-5 py-8 text-sm text-ink-faint text-center">No scores yet this week.</div>
            ) : (
              <table className="w-full">
                <tbody>
                  {cityScores.slice(0, 6).map((s: any, i: number) => (
                    <tr key={s.city} className="border-b border-border last:border-0 hover:bg-surface-raised transition-colors">
                      <td className="px-5 py-3 w-8">
                        <span className={`text-sm font-black ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-ink-faint'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 text-sm font-semibold text-ink">{s.city}</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-accent">{s.totalPoints} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Live games */}
        <div>
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Live Games</h2>
          <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
            {liveGames.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-ink-faint mb-3">No active games right now.</p>
                <Link to="/play" className="btn-primary text-sm px-6 py-2">Start a game</Link>
              </div>
            ) : (
              <div>
                {liveGames.map((g: any) => (
                  <Link key={g.id} to={`/game/${g.id}`}
                    className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0 hover:bg-surface-raised transition-colors">
                    <div className="text-sm">
                      <span className="font-semibold text-ink">{g.whiteUsername}</span>
                      <span className="text-ink-faint mx-2">vs</span>
                      <span className="font-semibold text-ink">{g.blackUsername || '...'}</span>
                    </div>
                    <span className="text-xs text-ink-faint">{g.spectators > 0 ? `${g.spectators} watching` : 'Watch'}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-10 text-center">What makes Damka different</h2>
          <div className="grid md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-surface-card px-6 py-7 hover:bg-surface-raised transition-colors">
                <div className="text-accent text-xl font-black mb-3 font-mono">{f.sym}</div>
                <h3 className="font-bold text-ink text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-border bg-surface-nav">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="font-display text-3xl font-black text-ink mb-3">Ready to compete?</h2>
          <p className="text-ink-muted text-sm mb-8">Free account. 500 coins on signup. Represent your city.</p>
          <Link to="/register" className="btn-primary px-12 py-3 text-base">Create Free Account</Link>
        </div>
      </div>

    </div>
  );
}
