import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../stores/auth';

const RARITY_BADGE: Record<string, string> = {
  legendary: 'text-yellow-400',
  epic: 'text-purple-400',
  rare: 'text-blue-400',
  common: 'text-ink-faint',
};

const TYPE_LABEL: Record<string, string> = { board: 'Board', piece: 'Piece Set', fx: 'Effect' };

export default function Shop() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [cosmetics, setCosmetics] = useState<any[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [buying, setBuying] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.cosmetics.list().then(setCosmetics).catch(() => {});
    api.cosmetics.owned().then((ids: string[]) => setOwned(new Set(ids))).catch(() => {});
  }, []);

  async function buy(id: string, price: number, name: string) {
    if (!user) return;
    if (user.coins < price) { setMsg('Not enough coins!'); return; }
    setBuying(id);
    try {
      await api.cosmetics.buy(id);
      setOwned(prev => new Set([...prev, id]));
      setUser({ ...user, coins: user.coins - price });
      setMsg(`Purchased ${name}!`);
    } catch (e: any) {
      setMsg(e.error || 'Purchase failed');
    } finally {
      setBuying(null);
    }
  }

  const groups = ['board', 'piece', 'fx'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">Shop</h1>
          <p className="text-ink-muted text-sm">Spend coins on cosmetics</p>
        </div>
        {user && (
          <div className="card-sm text-center">
            <p className="font-black text-coin text-lg">{user.coins}</p>
            <p className="text-xs text-ink-faint">coins</p>
          </div>
        )}
      </div>

      {msg && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-accent text-sm mb-4">{msg}</div>
      )}

      {groups.map(group => {
        const items = cosmetics.filter(c => c.type === group);
        if (!items.length) return null;
        return (
          <div key={group} className="mb-8">
            <p className="section-title mb-3">{TYPE_LABEL[group] || group}</p>
            <div className="grid grid-cols-2 gap-3">
              {items.map(c => (
                <div key={c.id} className="card border border-surface-border flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-ink text-sm">{c.name}</h3>
                    <span className={`text-xs font-semibold capitalize ${RARITY_BADGE[c.rarity]}`}>{c.rarity}</span>
                  </div>
                  <p className="text-xs text-ink-faint capitalize">{TYPE_LABEL[c.type]}</p>
                  <div className="mt-auto pt-1">
                    {c.price === 0 ? (
                      <span className="text-accent font-bold text-sm">Free (default)</span>
                    ) : owned.has(c.id) ? (
                      <span className="text-accent font-bold text-sm">Owned</span>
                    ) : (
                      <button
                        onClick={() => buy(c.id, c.price, c.name)}
                        disabled={!!buying || !user || (!!user && user.coins < c.price)}
                        className="btn-primary text-sm w-full disabled:opacity-40"
                      >
                        {buying === c.id ? 'Buying...' : `${c.price} coins`}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="card border border-yellow-500/30 bg-yellow-500/5 mt-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-ink">Pro Membership</h3>
              <span className="text-xs font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">PRO</span>
            </div>
            <p className="text-sm text-ink-muted">Animated pieces, exclusive boards, Pro badge, priority matchmaking, and detailed statistics.</p>
          </div>
          <button onClick={() => nav('/pro')} className="btn-primary shrink-0">
            $4.99/mo
          </button>
        </div>
      </div>
    </div>
  );
}
