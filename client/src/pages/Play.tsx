import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSocket } from '../lib/socket';
import { useAuth } from '../stores/auth';

const MODES = [
  {
    id: 'vsAI',
    title: 'Practice',
    sub: 'vs Computer',
    desc: 'Play against AI at your chosen difficulty. No stakes, just improvement.',
    badge: null,
  },
  {
    id: 'multiplayer',
    title: 'Challenge',
    sub: 'vs Friend',
    desc: 'Send a link. Your opponent joins instantly. No account needed on their end.',
    badge: 'Popular',
  },
  {
    id: 'ranked',
    title: 'Ranked',
    sub: 'Earn ELO',
    desc: 'Win to climb the global leaderboard and earn points for your city.',
    badge: 'Competitive',
  },
  {
    id: 'chaos',
    title: 'Chaos',
    sub: 'Random board',
    desc: 'Scrambled starting position. Pure tactics, no memorized openings.',
    badge: null,
  },
];

export default function Play() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
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
    socket.once('game:created', ({ gameId }: any) => nav(`/game/${gameId}`));
    socket.once('game:started', ({ gameId }: any) => nav(`/game/${gameId}`));
  }

  const mode = MODES.find(m => m.id === selected)!;

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <h1 className="font-display text-3xl font-black text-ink mb-1">New Game</h1>
        <p className="text-ink-muted text-sm mb-10">Choose your mode and start playing.</p>

        {/* Mode grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`relative text-left p-5 rounded-xl border transition-all duration-150 ${
                selected === m.id
                  ? 'border-accent bg-accent/6 shadow-[0_0_0_1px] shadow-accent'
                  : 'border-border bg-surface-card hover:border-border hover:bg-surface-raised'
              }`}
            >
              {m.badge && (
                <span className="absolute top-3 right-3 text-[10px] font-bold text-accent border border-accent/30 px-2 py-0.5 rounded-full">
                  {m.badge}
                </span>
              )}
              <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${selected === m.id ? 'text-accent' : 'text-ink-faint'}`}>
                {m.sub}
              </div>
              <div className="font-bold text-ink text-base">{m.title}</div>
              <div className="text-xs text-ink-muted mt-1.5 leading-relaxed">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Options */}
        <div className="bg-surface-card border border-border rounded-xl p-5 mb-6 space-y-5">
          {selected === 'vsAI' && (
            <div>
              <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">Difficulty</p>
              <div className="flex gap-2">
                {([
                  { v: 'easy', label: 'Easy', sub: '~900 ELO' },
                  { v: 'medium', label: 'Medium', sub: '~1200 ELO' },
                  { v: 'hard', label: 'Hard', sub: '~1600 ELO' },
                ] as const).map(({ v, label, sub }) => (
                  <button
                    key={v}
                    onClick={() => setDifficulty(v)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all text-center ${
                      difficulty === v
                        ? 'bg-accent text-white shadow-[0_2px_12px_rgba(127,166,80,0.4)]'
                        : 'bg-surface-raised text-ink-muted hover:text-ink'
                    }`}
                  >
                    <div>{label}</div>
                    <div className={`text-[10px] mt-0.5 ${difficulty === v ? 'text-white/70' : 'text-ink-faint'}`}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(selected === 'ranked' || selected === 'multiplayer') && user && (
            <div>
              <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-1">Coin Wager</p>
              <p className="text-xs text-ink-faint mb-3">Your balance: <span className="text-coin font-bold">{user.coins} coins</span></p>
              <div className="flex gap-2">
                {[0, 50, 100, 200].map(v => (
                  <button
                    key={v}
                    onClick={() => setWager(v)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      wager === v
                        ? 'bg-accent text-white'
                        : 'bg-surface-raised text-ink-muted hover:text-ink'
                    }`}
                  >
                    {v === 0 ? 'No wager' : `${v}c`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selected === 'ranked' && (
            <div className="text-xs text-ink-faint bg-surface-raised rounded-lg px-4 py-3 border border-border">
              Ranked games affect your ELO and earn points for <span className="text-ink font-semibold">{user?.city || 'your city'}</span> in the weekly rivalry.
            </div>
          )}

          {selected === 'multiplayer' && (
            <div className="text-xs text-ink-faint bg-surface-raised rounded-lg px-4 py-3 border border-border">
              You will get a shareable link after clicking Start. Send it to anyone — no account needed to accept.
            </div>
          )}
        </div>

        <button
          onClick={startGame}
          disabled={loading}
          className="btn-primary w-full py-3.5 text-base font-bold"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Starting...
            </span>
          ) : (
            `Start ${mode.title}`
          )}
        </button>

        {!user && (
          <p className="text-center text-xs text-ink-faint mt-4">
            You need an account to play.{' '}
            <a href="/register" className="text-accent hover:underline">Sign up free</a>
          </p>
        )}

      </motion.div>
    </div>
  );
}
