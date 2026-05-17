import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../stores/auth';
import { useT } from '../lib/i18n';

const BOSS_ICONS = ['I','II','III','IV','V'];
const ELO_COLORS = ['text-accent','text-blue-400','text-purple-400','text-yellow-400','text-red-400'];

export default function Bosses() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [bosses, setBosses] = useState<any[]>([]);
  const t = useT();

  useEffect(() => {
    api.bosses.list().then(setBosses).catch(() => {});
  }, [user]);

  function challengeBoss(boss: any) {
    if (!user) { nav('/register'); return; }
    const socket = getSocket();
    socket.emit('game:create', { userId: user.id, username: user.username, gameMode: 'boss_rush', bossId: boss.id, aiDifficulty: 'hard' });
    socket.once('game:started', ({ gameId }) => nav(`/game/${gameId}`));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-black text-ink mb-1">{t('bosses.title')}</h1>
      <p className="text-ink-muted text-sm mb-8">{t('bosses.subtitle')}</p>

      {!user && (
        <div className="card text-center mb-6 border-surface-border">
          <p className="text-ink-muted text-sm">{t('bosses.signIn')}</p>
        </div>
      )}

      <div className="space-y-3">
        {(bosses.length > 0 ? bosses : Array.from({length:5},(_,i) => ({id:i+1,name:`Boss ${i+1}`,description:'',eloStrength:'?',rewardName:'?',progress:null}))).map((boss, i) => {
          const beaten = boss.progress?.beaten;
          const locked = i > 0 && !bosses[i-1]?.progress?.beaten;
          return (
            <div key={boss.id}
              className={`card border flex items-center gap-4 transition-all ${
                beaten  ? 'border-accent/40 bg-accent/5' :
                locked  ? 'border-surface-border opacity-50' :
                          'border-surface-border hover:border-accent/50'
              }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0 bg-surface-raised ${ELO_COLORS[i]}`}>
                {BOSS_ICONS[i]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-ink">{boss.name}</span>
                  <span className="text-xs text-ink-faint bg-surface-raised px-2 py-0.5 rounded">Elo ~{boss.eloStrength}</span>
                  {boss.progress?.attempts > 0 && (
                    <span className="text-xs text-ink-faint">{boss.progress.attempts} attempt{boss.progress.attempts !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{boss.description}</p>
                <p className="text-xs text-ink-faint mt-0.5">{t('bosses.reward')} <span className="text-coin font-medium">{boss.rewardName}</span></p>
              </div>

              <div className="shrink-0">
                {beaten  ? <span className="text-accent text-sm font-bold">Defeated</span> :
                 locked  ? <span className="text-ink-faint text-sm">{t('bosses.locked')}</span> :
                 <button onClick={() => challengeBoss(boss)} className="btn-primary text-sm py-1.5 px-4">{t('bosses.challenge')}</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
