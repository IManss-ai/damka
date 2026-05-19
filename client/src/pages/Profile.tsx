import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

const TIER_COLORS: Record<string, string> = {
  Legend: 'text-yellow-400', Grandmaster: 'text-purple-400',
  Master: 'text-blue-400', Expert: 'text-accent',
  Club: 'text-ink-muted', Beginner: 'text-ink-faint',
};

const AVATAR_COLORS = ['#4a6130', '#2a4080', '#6b3a7d', '#7a4f00', '#1a5a5a'];

const OUTCOME_STYLE: Record<string, string> = {
  win: 'bg-accent/15 text-accent border-accent/30',
  loss: 'bg-danger/15 text-danger border-danger/30',
  draw: 'bg-surface-raised text-ink-muted border-border',
};

const MODE_LABEL: Record<string, string> = {
  casual: 'Casual', ranked: 'Ranked', blitz: 'Blitz', boss: 'Boss', tournament: 'Tournament',
};

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setProfile(null);
    setError('');
    api.users.profile(username!).then(setProfile).catch((e: any) => {
      setError(e?.error || 'Could not load profile');
    });
  }, [username]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h2 className="text-xl font-black text-ink mb-2">Profile not found</h2>
        <p className="text-ink-muted text-sm mb-6">{error}</p>
        <Link to="/leaderboard" className="btn-primary text-sm">Browse players</Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink-muted text-sm">Loading profile...</p>
      </div>
    );
  }

  const avatarColor = AVATAR_COLORS[profile.username.charCodeAt(0) % AVATAR_COLORS.length];
  const { wins = 0, losses = 0, draws = 0, winRate = 0, gamesPlayed = 0, recentGames = [] } = profile;

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-4">

      {/* Header card */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {profile.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-ink">{profile.username}</h1>
              {profile.isPro && (
                <span className="text-xs bg-coin/20 text-coin font-bold px-2 py-0.5 rounded">PRO</span>
              )}
            </div>
            <p className="text-sm text-ink-muted mt-0.5">{profile.city}</p>
            <p className={`text-xs font-bold mt-1 ${TIER_COLORS[profile.rank] ?? 'text-ink-faint'}`}>
              {profile.rank}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-ink">{profile.eloRating}</p>
            <p className="text-xs text-ink-faint">Elo Rating</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="stat-card text-center">
          <p className="text-xl font-black text-ink">{gamesPlayed}</p>
          <p className="text-xs text-ink-muted mt-1">Games</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xl font-black text-accent">{wins}</p>
          <p className="text-xs text-ink-muted mt-1">Wins</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xl font-black text-danger">{losses}</p>
          <p className="text-xs text-ink-muted mt-1">Losses</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xl font-black text-coin">{winRate}%</p>
          <p className="text-xs text-ink-muted mt-1">Win Rate</p>
        </div>
      </div>

      {/* Win-rate bar */}
      {gamesPlayed > 0 && (
        <div className="card py-3">
          <div className="flex justify-between text-xs text-ink-faint mb-2">
            <span>{wins}W</span>
            <span>{draws}D</span>
            <span>{losses}L</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex bg-surface-raised">
            {wins > 0 && (
              <div
                className="bg-accent h-full"
                style={{ width: `${(wins / gamesPlayed) * 100}%` }}
              />
            )}
            {draws > 0 && (
              <div
                className="bg-ink-faint/50 h-full"
                style={{ width: `${(draws / gamesPlayed) * 100}%` }}
              />
            )}
            {losses > 0 && (
              <div
                className="bg-danger h-full"
                style={{ width: `${(losses / gamesPlayed) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* More stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="stat-card text-center">
          <p className="text-xl font-black text-coin">{profile.coins}</p>
          <p className="text-xs text-ink-muted mt-1">Coins</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xl font-black text-accent">{profile.bossesBeaten}</p>
          <p className="text-xs text-ink-muted mt-1">Bosses</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xl font-black text-ink">{profile.streak}</p>
          <p className="text-xs text-ink-muted mt-1">🔥 Streak</p>
        </div>
      </div>

      {/* Recent games */}
      <div>
        <p className="section-title mb-3">Recent Games</p>
        {recentGames.length === 0 ? (
          <div className="card border border-accent/30 bg-accent/5 text-center py-8">
            <h2 className="text-base font-black text-ink mb-1">No games yet</h2>
            <p className="text-xs text-ink-muted mb-4 max-w-xs mx-auto">
              Your game history will appear here. Start with Practice mode against the AI.
            </p>
            <Link to="/play" className="btn-primary text-sm inline-block">
              Play your first game
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentGames.map((g: any) => (
              <div key={g.id} className="card flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded border uppercase w-12 text-center shrink-0 ${OUTCOME_STYLE[g.outcome]}`}>
                  {g.outcome}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">vs {g.opponent}</p>
                  <p className="text-xs text-ink-faint">{MODE_LABEL[g.gameMode] ?? g.gameMode}</p>
                </div>
                {g.eloChange !== 0 && (
                  <span className={`text-xs font-bold shrink-0 ${g.eloChange > 0 ? 'text-accent' : 'text-danger'}`}>
                    {g.eloChange > 0 ? '+' : ''}{g.eloChange}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
