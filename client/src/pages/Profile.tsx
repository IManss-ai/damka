import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';

const TIER_COLORS: Record<string, string> = {
  Legend: 'text-yellow-400', Grandmaster: 'text-purple-400',
  Master: 'text-blue-400', Expert: 'text-accent',
  Club: 'text-ink-muted', Beginner: 'text-ink-faint',
};

const AVATAR_COLORS = ['#4a6130','#2a4080','#6b3a7d','#7a4f00','#1a5a5a'];

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => { api.users.profile(username!).then(setProfile).catch(() => {}); }, [username]);

  if (!profile) return <div className="text-center py-20 text-ink-muted text-sm">Loading...</div>;

  const avatarColor = AVATAR_COLORS[profile.username.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="card mb-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black text-white shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {profile.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-ink">{profile.username}</h1>
              {profile.isPro && <span className="text-xs bg-coin/20 text-coin font-bold px-2 py-0.5 rounded">PRO</span>}
            </div>
            <p className="text-sm text-ink-muted">{profile.city} · {profile.gamesPlayed} games played</p>
            <p className={`text-xs font-bold mt-0.5 ${TIER_COLORS[profile.rank] ?? 'text-ink-faint'}`}>{profile.rank}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-ink">{profile.eloRating}</p>
            <p className="text-xs text-ink-faint">Elo Rating</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-xl font-black text-coin">{profile.coins}</p>
          <p className="text-xs text-ink-muted mt-1">Coins</p>
        </div>
        <div className="stat-card">
          <p className="text-xl font-black text-accent">{profile.bossesBeaten}</p>
          <p className="text-xs text-ink-muted mt-1">Bosses Beaten</p>
        </div>
        <div className="stat-card">
          <p className="text-xl font-black text-ink">{profile.streak}</p>
          <p className="text-xs text-ink-muted mt-1">Day Streak</p>
        </div>
      </div>
    </div>
  );
}
