import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';
import { useFriends } from '../stores/friends';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

function OnlineDot({ online }: { online: boolean }) {
  return (
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${online ? 'bg-green-400' : 'bg-ink-faint/30'}`} />
  );
}

function EloChip({ elo }: { elo: number }) {
  return (
    <span className="text-xs font-mono text-ink-muted bg-surface-raised px-1.5 py-0.5 rounded">{elo}</span>
  );
}

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { friends, requests, setFriends, setRequests } = useFriends();
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [inviteSent, setInviteSent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [fl, rl] = await Promise.all([api.friends.list(), api.friends.requests()]);
      setFriends((fl || []).map((f: any) => ({ ...f, online: false })));
      setRequests(rl || []);
    } catch {}
  }, [setFriends, setRequests]);

  useEffect(() => { load(); }, [load]);

  // Register socket presence + listen for online events
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.emit('user:register', { userId: user.id });
    socket.on('friend:online', ({ userId }: { userId: string }) => {
      useFriends.getState().setOnline(userId, true);
    });
    socket.on('friend:offline', ({ userId }: { userId: string }) => {
      useFriends.getState().setOnline(userId, false);
    });
    socket.on('friend:invite:offline', () => {
      setInviteSent(null);
      setError('That friend is currently offline.');
    });
    socket.on('friend:invite:declined', () => {
      setInviteSent(null);
      setError('Your friend declined the invite.');
    });
    socket.on('friend:invite:matched', ({ gameId, role }: { gameId: string; role: string; opponentId: string }) => {
      navigate(`/game/${gameId}?role=${role}`);
    });
    return () => {
      socket.off('friend:online');
      socket.off('friend:offline');
      socket.off('friend:invite:offline');
      socket.off('friend:invite:declined');
      socket.off('friend:invite:matched');
    };
  }, [user, navigate]);

  // Debounced search
  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.friends.search(searchQ);
        setSearchResults(res || []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  async function sendRequest(username: string, userId: string) {
    try {
      await api.friends.sendRequest(username);
      setSentTo(s => new Set(s).add(userId));
    } catch (e: any) {
      setError(e?.error || 'Failed to send request');
    }
  }

  async function accept(id: string) {
    try {
      await api.friends.accept(id);
      await load();
    } catch (e: any) { setError(e?.error || 'Failed'); }
  }

  async function decline(id: string) {
    try {
      await api.friends.decline(id);
      setRequests(requests.filter(r => r.id !== id));
    } catch (e: any) { setError(e?.error || 'Failed'); }
  }

  async function remove(friendId: string, friendshipId: string) {
    setRemoving(friendshipId);
    try {
      await api.friends.remove(friendId);
      setFriends(friends.filter(f => f.friendshipId !== friendshipId));
    } catch (e: any) { setError(e?.error || 'Failed'); }
    setRemoving(null);
  }

  function challenge(friend: { id: string; username: string }) {
    if (!user) return;
    const socket = getSocket();
    setInviteSent(friend.id);
    socket.emit('friend:invite', { toUserId: friend.id, fromUsername: user.username, fromUserId: user.id });
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-ink-muted mb-4">Sign in to see your friends</p>
          <button onClick={() => navigate('/login')} className="btn-primary">Sign in</button>
        </div>
      </div>
    );
  }

  const pendingCount = requests.length;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-display font-black text-ink">Friends</h1>
        <button
          onClick={() => { setSearchOpen(o => !o); setSearchQ(''); setSearchResults([]); }}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add friend
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-danger/60 hover:text-danger ml-2">✕</button>
        </div>
      )}

      {/* Search panel */}
      {searchOpen && (
        <div className="mb-5 bg-surface-card border border-border rounded-2xl p-4">
          <input
            autoFocus
            type="text"
            placeholder="Search username..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent"
          />
          {searching && <p className="text-xs text-ink-faint mt-3">Searching...</p>}
          {searchResults.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {searchResults.map(u => (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-sm font-black text-accent shrink-0">
                      {u.username[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{u.username}</p>
                      <p className="text-xs text-ink-faint">{u.city} · {u.eloRating} ELO</p>
                    </div>
                  </div>
                  {sentTo.has(u.id) ? (
                    <span className="text-xs text-green-400 font-medium shrink-0">Sent ✓</span>
                  ) : (
                    <button
                      onClick={() => sendRequest(u.username, u.id)}
                      className="btn-primary text-xs py-1.5 px-3 shrink-0"
                    >
                      Add
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {searchQ.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-xs text-ink-faint mt-3">No users found</p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-surface-raised rounded-xl p-1 mb-5 gap-1">
        {(['friends', 'requests'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              tab === t ? 'bg-surface-card text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t === 'friends' ? `Friends${friends.length ? ` (${friends.length})` : ''}` : 'Requests'}
            {t === 'requests' && pendingCount > 0 && (
              <span className="bg-accent text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {tab === 'friends' && (
        <div className="flex flex-col gap-3">
          {friends.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🤝</p>
              <p className="text-ink-muted text-sm">No friends yet. Add someone to play with!</p>
            </div>
          )}
          {friends.map(({ friendshipId, friend, online }) => (
            <div key={friendshipId} className="bg-surface-card border border-border rounded-2xl px-4 py-4 flex items-center gap-3">
              <div className="relative shrink-0">
                <span className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-base font-black text-accent">
                  {friend.username[0]?.toUpperCase()}
                </span>
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-card ${online ? 'bg-green-400' : 'bg-ink-faint/30'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink truncate">{friend.username}</p>
                  <OnlineDot online={online} />
                  {online && <span className="text-xs text-green-400 font-medium">Online</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <EloChip elo={friend.eloRating} />
                  <span className="text-xs text-ink-faint">{friend.city}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {inviteSent === friend.id ? (
                  <span className="text-xs text-ink-muted">Waiting...</span>
                ) : (
                  <button
                    onClick={() => challenge(friend)}
                    disabled={!online}
                    className={`text-xs font-semibold py-2 px-3 rounded-xl transition-colors ${
                      online
                        ? 'bg-accent text-white hover:bg-accent/80'
                        : 'bg-surface-raised text-ink-faint cursor-not-allowed'
                    }`}
                  >
                    Challenge
                  </button>
                )}
                <button
                  onClick={() => remove(friend.id, friendshipId)}
                  disabled={removing === friendshipId}
                  className="p-2 text-ink-faint hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
                  aria-label="Remove friend"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests tab */}
      {tab === 'requests' && (
        <div className="flex flex-col gap-3">
          {requests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📬</p>
              <p className="text-ink-muted text-sm">No pending friend requests</p>
            </div>
          )}
          {requests.map(r => (
            <div key={r.id} className="bg-surface-card border border-border rounded-2xl px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-base font-black text-accent shrink-0">
                  {r.from.username[0]?.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{r.from.username}</p>
                  <p className="text-xs text-ink-faint">{r.from.city} · {r.from.eloRating} ELO</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => accept(r.id)}
                  className="btn-primary text-sm py-2 flex-1"
                >
                  Accept
                </button>
                <button
                  onClick={() => decline(r.id)}
                  className="btn-secondary text-sm py-2 flex-1"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
