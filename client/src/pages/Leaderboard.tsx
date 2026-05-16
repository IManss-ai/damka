import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const TIER_COLORS: Record<string, string> = {
  Legend: 'text-yellow-400', Grandmaster: 'text-purple-400',
  Master: 'text-blue-400', Expert: 'text-accent',
  Club: 'text-ink-muted', Beginner: 'text-ink-faint',
};

export default function Leaderboard() {
  const [tab, setTab] = useState<'global'|'city'>('global');
  const [global, setGlobal] = useState<any[]>([]);
  const [city, setCity] = useState<any[]>([]);

  useEffect(() => {
    api.leaderboard.global().then(setGlobal).catch(() => {});
    api.leaderboard.city().then(setCity).catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-black text-ink mb-6">Leaderboard</h1>

      <div className="flex gap-2 mb-6 bg-surface-nav rounded-lg p-1 w-fit">
        {(['global','city'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-all ${
              tab === t ? 'bg-surface-raised text-ink' : 'text-ink-muted hover:text-ink'
            }`}>
            {t === 'global' ? 'Global' : 'City Rivalry'}
          </button>
        ))}
      </div>

      {tab === 'global' && (
        <div className="card divide-y divide-surface-border">
          {global.map((u) => (
            <Link key={u.id} to={`/profile/${u.username}`}
              className="flex items-center gap-3 py-3 px-1 hover:bg-surface-raised rounded-lg transition-colors first:pt-0 last:pb-0">
              <span className="w-8 font-black text-ink-faint text-sm">#{u.rank}</span>
              <div className="flex-1">
                <span className="font-semibold text-ink">{u.username}</span>
                <span className="text-xs text-ink-faint ml-2">{u.city}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-ink">{u.eloRating}</div>
                <div className={`text-xs font-bold ${TIER_COLORS[u.tier] ?? 'text-ink-faint'}`}>{u.tier}</div>
              </div>
            </Link>
          ))}
          {global.length === 0 && <p className="text-ink-faint text-center py-10 text-sm">No players yet — be the first!</p>}
        </div>
      )}

      {tab === 'city' && (
        <div className="card">
          <p className="text-xs text-ink-faint mb-4">Points reset every Monday. Win ranked games to earn points for your city.</p>
          <div className="space-y-2">
            {city.map((s) => (
              <div key={s.city} className="flex items-center gap-3 px-3 py-2.5 bg-surface-raised rounded-lg">
                <span className="font-black text-accent w-8 text-sm">#{s.rank}</span>
                <span className="flex-1 font-semibold text-ink">{s.city}</span>
                <span className="font-bold text-ink-muted text-sm">{s.totalPoints} pts</span>
              </div>
            ))}
            {city.length === 0 && <p className="text-ink-faint text-center py-10 text-sm">No city scores this week yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
