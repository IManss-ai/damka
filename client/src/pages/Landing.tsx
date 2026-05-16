import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSocket } from '../lib/socket';
import { api } from '../lib/api';

export default function Landing() {
  const [liveGames, setLiveGames] = useState<any[]>([]);
  const [cityScores, setCityScores] = useState<any[]>([]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('lobby:join');
    socket.on('lobby:games', setLiveGames);
    socket.on('lobby:gameCreated', (g) => setLiveGames(p => [g, ...p].slice(0, 5)));
    socket.on('lobby:gameEnded', ({ gameId }) => setLiveGames(p => p.filter(g => g.id !== gameId)));
    api.leaderboard.city().then(setCityScores).catch(() => {});
    return () => { socket.off('lobby:games'); socket.off('lobby:gameCreated'); socket.off('lobby:gameEnded'); };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="text-7xl mb-5 select-none">♟</div>
        <h1 className="text-5xl font-black text-ink mb-3 tracking-tight">Damka</h1>
        <p className="text-lg text-ink-muted mb-1">The checkers platform that makes every game matter.</p>
        <p className="text-sm text-ink-faint mb-10">City rivalries · AI coaching · Live multiplayer · Boss Rush</p>
        <div className="flex gap-3 justify-center">
          <Link to="/play" className="btn-primary text-base px-10 py-2.5">Play Now</Link>
          <Link to="/leaderboard" className="btn-secondary text-base px-10 py-2.5">Leaderboard</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Live Games */}
        <div className="card">
          <h2 className="text-sm font-bold text-ink-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse inline-block" />
            Live Games ({liveGames.length})
          </h2>
          {liveGames.length === 0 ? (
            <p className="text-ink-faint text-sm">No games right now — be the first!</p>
          ) : (
            <div className="space-y-1">
              {liveGames.map(g => (
                <Link key={g.id} to={`/game/${g.id}`}
                  className="flex items-center justify-between px-3 py-2 hover:bg-surface-raised rounded-lg text-sm transition-colors">
                  <span className="font-medium text-ink">{g.whiteUsername} <span className="text-ink-faint">vs</span> {g.blackUsername || '...'}</span>
                  <span className="text-ink-muted text-xs">{g.spectators} watching</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* City Rivalry */}
        <div className="card">
          <h2 className="text-sm font-bold text-ink-muted uppercase tracking-widest mb-4">City Rivalry This Week</h2>
          {cityScores.length === 0 ? (
            <p className="text-ink-faint text-sm">No city scores yet this week.</p>
          ) : (
            <div className="space-y-1">
              {cityScores.slice(0, 5).map((s, i) => (
                <div key={s.city} className="flex items-center gap-3 px-3 py-2">
                  <span className="font-black text-accent w-5 text-sm">{i + 1}</span>
                  <span className="font-semibold text-ink flex-1">{s.city}</span>
                  <span className="text-ink-muted text-sm font-medium">{s.totalPoints} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { icon: '♟', title: 'AI Coach',     desc: 'Post-game analysis of your moves' },
          { icon: '⚔',  title: 'Nemesis',     desc: 'Your personal rival. Settle scores.' },
          { icon: '★',  title: 'Boss Rush',   desc: '5 bosses. Beat them all to unlock rewards.' },
          { icon: '◈',  title: 'Daily Puzzle', desc: 'One puzzle. Global ranking. Daily streak.' },
        ].map(f => (
          <div key={f.title} className="card text-center hover:border-accent transition-colors cursor-default">
            <div className="text-2xl mb-3 text-accent">{f.icon}</div>
            <div className="font-bold text-ink text-sm">{f.title}</div>
            <div className="text-xs text-ink-muted mt-1 leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
