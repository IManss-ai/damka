import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSocket } from '../lib/socket';
import { api } from '../lib/api';

// Static board preview for hero — mid-game position
type PreviewPiece = { color: 'w' | 'b'; king?: boolean };
const INITIAL_BOARD: (PreviewPiece | null)[][] = (() => {
  const b: (PreviewPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const wp = [[5,0],[5,2],[5,4],[5,6],[6,1],[6,3],[6,5],[6,7],[7,0],[7,2],[7,4]];
  const bp = [[0,1],[0,3],[0,5],[0,7],[1,0],[1,2],[2,5],[3,2],[3,6],[4,1]];
  wp.forEach(([r,c]) => { b[r][c] = { color: 'w' }; });
  bp.forEach(([r,c]) => { b[r][c] = { color: 'b' }; });
  b[3][6] = { color: 'b', king: true };
  b[7][4] = { color: 'w', king: true };
  return b;
})();

// Plausible follow-up moves to cycle through — each (from,to) on dark squares
const PREVIEW_MOVES: { from: [number, number]; to: [number, number] }[] = [
  { from: [5, 0], to: [4, 1] },
  { from: [4, 1], to: [3, 0] },
  { from: [6, 5], to: [5, 4] },
  { from: [3, 2], to: [4, 1] },
];

function MiniBoard() {
  const SQ = 44;
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [moveIdx, setMoveIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMoveIdx(i => (i + 1) % PREVIEW_MOVES.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Reset board, then apply move
    const next: (PreviewPiece | null)[][] = INITIAL_BOARD.map(row => row.slice());
    const mv = PREVIEW_MOVES[moveIdx];
    const piece = next[mv.from[0]][mv.from[1]];
    if (piece) {
      next[mv.from[0]][mv.from[1]] = null;
      next[mv.to[0]][mv.to[1]] = piece;
    }
    setBoard(next);
  }, [moveIdx]);
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl" style={{
      width: SQ * 8, height: SQ * 8,
      boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 2px #0f0e0c, 0 0 0 5px #252220',
    }}>
      {[0,1,2,3,4,5,6,7].map(row => (
        <div key={row} className="flex">
          {[0,1,2,3,4,5,6,7].map(col => {
            const dark = (row + col) % 2 === 1;
            const p = board[row][col];
            return (
              <div key={col} style={{
                width: SQ, height: SQ, flexShrink: 0,
                backgroundColor: dark ? '#4e6e30' : '#c8c39e',
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {p && (
                  <div style={{
                    width: SQ * 0.78, height: SQ * 0.78, borderRadius: '50%',
                    background: p.color === 'w'
                      ? 'linear-gradient(135deg, #f8f0dc, #c8a870)'
                      : 'linear-gradient(135deg, #4a4440, #181512)',
                    border: p.color === 'w' ? '2.5px solid #b89050' : '2.5px solid #5e564e',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: p.color === 'w' ? '#8B6914' : '#d4a820',
                    fontFamily: 'serif',
                    transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
                  }}>
                    {p.king ? '♛' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  const [liveGames, setLiveGames] = useState<any[]>([]);
  const [cityScores, setCityScores] = useState<any[]>([]);
  const [playerCount, setPlayerCount] = useState(15);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('lobby:join');
    socket.on('lobby:games', (g: any[]) => setLiveGames(g));
    socket.on('lobby:gameCreated', (g: any) => setLiveGames(p => [g, ...p].slice(0, 5)));
    socket.on('lobby:gameEnded', ({ gameId }: any) => setLiveGames(p => p.filter((g: any) => g.id !== gameId)));
    api.leaderboard.city().then(setCityScores).catch(() => {});
    api.leaderboard.global().then((p: any[]) => setPlayerCount(p.length || 15)).catch(() => {});
    return () => { socket.off('lobby:games'); socket.off('lobby:gameCreated'); socket.off('lobby:gameEnded'); };
  }, []);

  return (
    <div className="min-h-screen">

      {/* HERO — two column: text left, board right */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }}>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-accent border border-accent/25 bg-accent/8 px-3 py-1 rounded-full mb-8 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {liveGames.length > 0 ? `${liveGames.length} games live now` : `${playerCount} players on the platform`}
            </div>

            <h1 className="font-display text-6xl font-black text-ink mb-4 leading-none tracking-tight">
              Competitive<br />
              <span style={{ color: '#7fa650' }}>Checkers.</span>
            </h1>

            <p className="text-ink-muted text-lg mb-3 leading-relaxed">
              Russian шашки with real stakes — ELO rankings, city rivalries, AI coaching, and a boss campaign.
            </p>
            <p className="text-ink-faint text-sm mb-10">
              Built for Kazakhstan. Open to the world.
            </p>

            <div className="flex gap-3">
              <Link to="/register" className="btn-primary px-8 py-3 text-base">Play Free</Link>
              <Link to="/leaderboard" className="btn-secondary px-6 py-3">See Rankings</Link>
            </div>

            <div className="flex gap-6 mt-10 pt-8 border-t border-border">
              <div>
                <div className="text-2xl font-black text-ink">{playerCount}+</div>
                <div className="text-xs text-ink-faint mt-0.5">Ranked players</div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">5</div>
                <div className="text-xs text-ink-faint mt-0.5">AI bosses</div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">7</div>
                <div className="text-xs text-ink-faint mt-0.5">Cities competing</div>
              </div>
              <div>
                <div className="text-2xl font-black text-accent">Live</div>
                <div className="text-xs text-ink-faint mt-0.5">Multiplayer</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="flex justify-center md:justify-end"
          >
            <div className="relative">
              <MiniBoard />
              {/* floating label */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-surface-card border border-border rounded-full px-4 py-1.5 text-xs font-semibold text-ink-muted whitespace-nowrap shadow-lg">
                Live match preview
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats ticker */}
      <div className="bg-surface-nav border-b border-border py-3 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-6 overflow-x-auto text-xs text-ink-faint font-medium">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-ink-muted">{liveGames.length} live</span>
          </span>
          <span className="shrink-0">|</span>
          <span className="shrink-0">{playerCount} ranked players</span>
          <span className="shrink-0">|</span>
          <span className="shrink-0">Season 1 active</span>
          {liveGames.slice(0, 2).map((g: any) => (
            <Link key={g.id} to={`/game/${g.id}`} className="shrink-0 hover:text-accent transition-colors font-mono">
              {g.whiteUsername} vs {g.blackUsername || '...'}
            </Link>
          ))}
        </div>
      </div>

      {/* City + Live side by side */}
      <div className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">City Rivalry — This Week</p>
          <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
            {cityScores.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink-faint text-center">No scores yet.</p>
            ) : (
              <table className="w-full">
                <tbody>
                  {cityScores.slice(0, 6).map((s: any, i: number) => (
                    <tr key={s.city} className="border-b border-border last:border-0 hover:bg-surface-raised transition-colors">
                      <td className="px-5 py-3 w-9 text-sm font-black" style={{
                        color: i === 0 ? '#facc15' : i === 1 ? '#cbd5e1' : i === 2 ? '#d97706' : '#5a5450'
                      }}>{i + 1}</td>
                      <td className="py-3 text-sm font-semibold text-ink">{s.city}</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-accent">{s.totalPoints} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Live Games</p>
          <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
            {liveGames.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-ink-faint mb-4">No games right now.</p>
                <Link to="/play" className="btn-primary text-sm px-6 py-2">Start a game</Link>
              </div>
            ) : liveGames.map((g: any) => (
              <Link key={g.id} to={`/game/${g.id}`}
                className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0 hover:bg-surface-raised transition-colors">
                <div className="text-sm font-medium text-ink">
                  <span className="font-semibold">{g.whiteUsername}</span>
                  <span className="text-ink-faint mx-2 text-xs">vs</span>
                  <span className="font-semibold">{g.blackUsername || '...'}</span>
                </div>
                <span className="text-xs text-accent font-semibold">Watch</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Features — clean grid, no emojis */}
      <div className="border-t border-b border-border bg-surface-nav">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-10 text-center">What makes this different</p>
          <div className="grid md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {[
              { label: 'AI Coach', body: 'Claude analyzes every game. Tells you the exact move where you won or lost the position.' },
              { label: 'Live Multiplayer', body: 'WebSocket-powered real-time games. Share a link, your opponent joins instantly.' },
              { label: 'Boss Campaign', body: '5 bosses from 900 to 1800 ELO. Beat them all to unlock exclusive cosmetics.' },
              { label: 'City Rivalries', body: 'Your ranked wins earn points for your city. Weekly leaderboard resets every Monday.' },
              { label: 'ELO Ranking', body: 'Real rating system. Every ranked game moves your score. Climb or fall — no hiding.' },
              { label: 'Daily Puzzle', body: 'One forced-capture tactic per day. Compete globally on solve speed.' },
            ].map((f) => (
              <div key={f.label} className="bg-surface-card px-6 py-8 hover:bg-surface-raised transition-colors group">
                <div className="w-8 h-0.5 bg-accent mb-4 group-hover:w-12 transition-all duration-200" />
                <h3 className="font-bold text-ink text-sm mb-2">{f.label}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-4xl font-black text-ink mb-3 leading-tight">
          Your city needs you.
        </h2>
        <p className="text-ink-muted mb-8 text-base">Free account. 500 coins on signup. First season starts now.</p>
        <Link to="/register" className="btn-primary px-14 py-3.5 text-base">Create Free Account</Link>
      </div>

    </div>
  );
}
