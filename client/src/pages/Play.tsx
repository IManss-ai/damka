import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../lib/socket';
import { useAuth } from '../stores/auth';

const MODES = [
  { id: 'vsAI',       icon: '♟', title: 'vs AI',       desc: 'Practice against the computer' },
  { id: 'multiplayer',icon: '⚔', title: 'vs Friend',   desc: 'Share a link and play together' },
  { id: 'ranked',     icon: '★', title: 'Ranked',      desc: 'Play for Elo and city points' },
  { id: 'chaos',      icon: '◈', title: 'Chaos Mode',  desc: 'Random starting position' },
];

export default function Play() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [wager, setWager] = useState(0);
  const [selected, setSelected] = useState('vsAI');
  const [loading, setLoading] = useState(false);

  function startGame() {
    if (!user) { nav('/register'); return; }
    setLoading(true);
    const socket = getSocket();
    socket.emit('game:create', {
      userId: user.id, username: user.username,
      wagerAmount: wager, gameMode: selected,
      aiDifficulty: selected === 'vsAI' ? difficulty : undefined,
    });
    socket.once('game:created', ({ gameId }) => { nav(`/game/${gameId}`); });
    socket.once('game:started', ({ gameId }) => { nav(`/game/${gameId}`); });
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-black text-ink mb-1">Choose Game Mode</h1>
      <p className="text-ink-muted text-sm mb-8">Pick how you want to play</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setSelected(m.id)}
            className={`card text-left transition-all hover:border-accent ${
              selected === m.id
                ? 'border-accent bg-accent/5 ring-1 ring-accent'
                : 'border-surface-border'
            }`}>
            <div className="text-xl text-accent mb-2">{m.icon}</div>
            <div className="font-bold text-ink text-sm">{m.title}</div>
            <div className="text-xs text-ink-muted mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>

      {selected === 'vsAI' && (
        <div className="card mb-4">
          <p className="section-title">Difficulty</p>
          <div className="flex gap-2">
            {(['easy','medium','hard'] as const).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm capitalize transition-all ${
                  difficulty === d
                    ? 'bg-accent text-white'
                    : 'bg-surface-raised text-ink-muted hover:text-ink'
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {(selected === 'ranked' || selected === 'multiplayer') && user && (
        <div className="card mb-4">
          <p className="section-title">Coin Wager (optional)</p>
          <p className="text-xs text-ink-faint mb-3">Balance: {user.coins} coins</p>
          <div className="flex gap-2">
            {[0, 50, 100, 200].map(v => (
              <button key={v} onClick={() => setWager(v)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  wager === v
                    ? 'bg-accent text-white'
                    : 'bg-surface-raised text-ink-muted hover:text-ink'
                }`}>
                {v === 0 ? 'None' : `${v}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={startGame} disabled={loading}
        className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-60">
        {loading ? 'Starting...' : '♟  Start Game'}
      </button>
    </div>
  );
}
