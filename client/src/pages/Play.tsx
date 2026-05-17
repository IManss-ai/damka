import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSocket } from '../lib/socket';
import { useAuth } from '../stores/auth';
import { useT } from '../lib/i18n';

const Icons = {
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M8 21h8" /><path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H5a2 2 0 0 0 0 4h2" /><path d="M17 6h2a2 2 0 0 1 0 4h-2" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  ),
  dots: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <circle cx="6" cy="6" r="1.6" /><circle cx="18" cy="6" r="1.6" />
      <circle cx="12" cy="12" r="1.6" /><circle cx="6" cy="18" r="1.6" />
      <circle cx="18" cy="18" r="1.6" /><circle cx="20" cy="11" r="1.6" />
    </svg>
  ),
  bracket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M4 5v6a2 2 0 0 0 2 2h4" /><path d="M4 19v-6a2 2 0 0 1 2-2h4" />
      <path d="M20 12h-6" /><path d="M14 12h-4" />
    </svg>
  ),
};

export default function Play() {
  const { user } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [wager, setWager] = useState(0);
  const [selected, setSelected] = useState('vsAI');
  const [loading, setLoading] = useState(false);

  const MODES = [
    {
      id: 'vsAI',
      title: t('play.practice'),
      sub: t('play.vsComputer'),
      desc: t('play.practiceDesc'),
      badge: null,
      icon: Icons.target,
      disabled: false,
    },
    {
      id: 'multiplayer',
      title: t('play.challenge'),
      sub: t('play.vsFriend'),
      desc: t('play.challengeDesc'),
      badge: t('play.popular'),
      icon: Icons.link,
      disabled: false,
    },
    {
      id: 'ranked',
      title: t('play.ranked'),
      sub: t('play.earnElo'),
      desc: t('play.rankedDesc'),
      badge: t('play.competitive'),
      icon: Icons.trophy,
      disabled: false,
    },
    {
      id: 'blitz',
      title: t('play.blitz'),
      sub: t('play.blitzClock'),
      desc: t('play.blitzDesc'),
      badge: t('play.new'),
      icon: Icons.bolt,
      disabled: false,
    },
    {
      id: 'chaos',
      title: t('play.chaos'),
      sub: t('play.randomBoard'),
      desc: t('play.chaosDesc'),
      badge: null,
      icon: Icons.dots,
      disabled: false,
    },
    {
      id: 'tournament',
      title: t('play.tournament'),
      sub: t('play.weeklyBracket'),
      desc: t('play.tournamentDesc'),
      badge: t('play.soon'),
      icon: Icons.bracket,
      disabled: true,
    },
  ];

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

  const difficultyOptions = [
    { v: 'easy' as const, label: t('play.easy'), sub: '~900 ELO' },
    { v: 'medium' as const, label: t('play.medium'), sub: '~1200 ELO' },
    { v: 'hard' as const, label: t('play.hard'), sub: '~1600 ELO' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <h1 className="font-display text-3xl font-black text-ink mb-1">{t('play.title')}</h1>
        <p className="text-ink-muted text-sm mb-10">{t('play.subtitle')}</p>

        {/* Mode grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => !m.disabled && setSelected(m.id)}
              disabled={m.disabled}
              className={`relative text-left p-5 rounded-xl border transition-all duration-150 ${
                m.disabled
                  ? 'border-border bg-surface-card opacity-50 cursor-not-allowed'
                  : selected === m.id
                  ? 'border-accent bg-accent/6 shadow-[0_0_0_1px] shadow-accent'
                  : 'border-border bg-surface-card hover:border-border hover:bg-surface-raised'
              }`}
            >
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {m.badge && (
                  <span className="text-[10px] font-bold text-accent border border-accent/30 px-2 py-0.5 rounded-full">
                    {m.badge}
                  </span>
                )}
                <span className={`${selected === m.id ? 'text-accent' : 'text-ink-faint'}`}>
                  {m.icon}
                </span>
              </div>
              <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${selected === m.id ? 'text-accent' : 'text-ink-faint'}`}>
                {m.sub}
              </div>
              <div className="font-bold text-ink text-base">{m.title}</div>
              <div className="text-xs text-ink-muted mt-1.5 leading-relaxed pr-2">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Options */}
        <div className="bg-surface-card border border-border rounded-xl p-5 mb-6 space-y-5">
          {selected === 'vsAI' && (
            <div>
              <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">{t('play.difficulty')}</p>
              <div className="flex gap-2">
                {difficultyOptions.map(({ v, label, sub }) => (
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
            {t('play.needAccount')}{' '}
            <a href="/register" className="text-accent hover:underline">{t('play.signUpFree')}</a>
          </p>
        )}

      </motion.div>
    </div>
  );
}
