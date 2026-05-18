import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSocket } from '../lib/socket';
import { useAuth } from '../stores/auth';
import { useT } from '../lib/i18n';

const TARGET_PLAYERS = 2; // 2 players for fast demo; bracket logic scales to 4

interface Player { userId: string; username: string; }
interface Match { p1?: Player; p2?: Player; winnerId?: string | null; gameId?: string | null; }
interface Bracket { semis: Match[]; final: Match; }

export default function Tournament() {
  const { user } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [bracket, setBracket] = useState<Bracket | null>(null);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    socket.on('tournament:update', ({ players: list }: { players: Player[] }) => {
      setPlayers(list);
    });

    socket.on('tournament:start', ({ bracket: br, yourGameId }: { bracket: Bracket; yourGameId?: string }) => {
      setBracket(br);
      if (yourGameId) {
        // brief delay so the user sees the bracket flash before navigating
        setTimeout(() => nav(`/game/${yourGameId}`), 1200);
      }
    });

    socket.on('tournament:bracket', ({ bracket: br }: { bracket: Bracket }) => {
      setBracket(br);
    });

    socket.on('tournament:final', ({ gameId }: { gameId: string }) => {
      nav(`/game/${gameId}`);
    });

    return () => {
      socket.off('tournament:update');
      socket.off('tournament:start');
      socket.off('tournament:bracket');
      socket.off('tournament:final');
    };
  }, [user?.id]);

  function joinTournament() {
    if (!user) return;
    const socket = getSocket();
    socket.emit('tournament:join', { userId: user.id, username: user.username });
    setJoined(true);
  }

  function leaveTournament() {
    if (!user) return;
    const socket = getSocket();
    socket.emit('tournament:leave', { userId: user.id });
    setJoined(false);
    setPlayers([]);
  }

  if (!user) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="card-glow">
        <h2 className="font-display text-xl font-black text-ink mb-2">{t('tournament.signInTitle')}</h2>
        <p className="text-ink-muted text-sm mb-6">{t('tournament.signInBody')}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/login" className="btn-primary">{t('nav.login')}</Link>
          <Link to="/register" className="btn-secondary">{t('nav.signUp')}</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

        <div className="flex items-center gap-3 mb-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent">
            <path d="M4 5v6a2 2 0 0 0 2 2h4" /><path d="M4 19v-6a2 2 0 0 1 2-2h4" />
            <path d="M20 12h-6" /><path d="M14 12h-4" />
          </svg>
          <h1 className="font-display text-3xl font-black text-ink">{t('tournament.title')}</h1>
        </div>
        <p className="text-ink-muted text-sm mb-8">{t('tournament.subtitle')}</p>

        {!joined && !bracket && (
          <div className="card border border-border">
            <h2 className="font-bold text-ink mb-2">{t('tournament.howWorks')}</h2>
            <ul className="text-sm text-ink-muted space-y-1.5 mb-6 list-disc pl-5">
              <li>{t('tournament.rule1')}</li>
              <li>{t('tournament.rule2')}</li>
              <li>{t('tournament.rule3')}</li>
            </ul>
            <button onClick={joinTournament} className="btn-primary w-full">
              {t('tournament.joinBtn')}
            </button>
          </div>
        )}

        {joined && !bracket && (
          <div className="card border border-accent/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="section-title">{t('tournament.waiting')}</p>
                <p className="text-xl font-black text-ink mt-1">
                  {players.length} / {TARGET_PLAYERS} {t('tournament.players')}
                </p>
              </div>
              <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-1.5 mb-4">
              {players.map(p => (
                <div key={p.userId} className="flex items-center gap-2 px-3 py-2 bg-surface-raised rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-black text-accent">
                    {p.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-ink">{p.username}</span>
                  {p.userId === user.id && <span className="text-xs text-ink-faint ml-auto">{t('tournament.you')}</span>}
                </div>
              ))}
            </div>
            <button onClick={leaveTournament} className="btn-secondary w-full text-sm">
              {t('tournament.leave')}
            </button>
          </div>
        )}

        {bracket && <BracketView bracket={bracket} currentUserId={user.id} />}

      </motion.div>
    </div>
  );
}

function BracketView({ bracket, currentUserId }: { bracket: Bracket; currentUserId: string }) {
  const t = useT();
  return (
    <div className="card border border-accent/30">
      <p className="section-title mb-4">{t('tournament.bracket')}</p>
      <div className="space-y-6">
        <div>
          <p className="text-xs text-ink-faint font-bold uppercase tracking-wider mb-2">
            {t('tournament.semifinals')}
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {bracket.semis.map((m, i) => <MatchBox key={i} match={m} highlight={currentUserId} />)}
          </div>
        </div>
        <div>
          <p className="text-xs text-ink-faint font-bold uppercase tracking-wider mb-2">
            {t('tournament.final')}
          </p>
          <MatchBox match={bracket.final} highlight={currentUserId} />
        </div>
      </div>
    </div>
  );
}

function MatchBox({ match, highlight }: { match: Match; highlight: string }) {
  const t = useT();
  function row(p?: Player) {
    if (!p) return <span className="text-ink-faint italic">{t('tournament.tbd')}</span>;
    const isYou = p.userId === highlight;
    const isWinner = match.winnerId === p.userId;
    return (
      <span className={`flex items-center gap-2 ${isWinner ? 'text-accent font-bold' : isYou ? 'text-ink font-semibold' : 'text-ink-muted'}`}>
        <span className="truncate">{p.username}</span>
        {isYou && <span className="text-[10px] text-ink-faint">{t('tournament.you')}</span>}
        {isWinner && <span className="text-[10px] ml-auto">★</span>}
      </span>
    );
  }
  return (
    <div className="bg-surface-raised border border-border rounded-lg p-3 text-sm">
      <div className="mb-1">{row(match.p1)}</div>
      <div className="text-xs text-ink-faint text-center my-1">vs</div>
      <div>{row(match.p2)}</div>
    </div>
  );
}
