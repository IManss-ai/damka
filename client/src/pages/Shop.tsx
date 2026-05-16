import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../stores/auth';

const RARITY_COLORS: Record<string, string> = { legendary: 'border-yellow-400 bg-yellow-50', epic: 'border-purple-400 bg-purple-50', rare: 'border-blue-400 bg-blue-50', common: 'border-amber-200 bg-white' };

export default function Shop() {
  const { user, setUser, fetchMe } = useAuth();
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-black text-amber-800">Shop</h1><p className="text-amber-500">Spend coins on cosmetics</p></div>
        {user && <div className="card text-center px-4 py-2"><p className="font-black text-amber-700">Coins: {user.coins}</p><p className="text-xs text-amber-400">your balance</p></div>}
      </div>
      {msg && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm mb-4">{msg}</div>}
      <div className="grid grid-cols-2 gap-4">
        {cosmetics.map(c => (
          <div key={c.id} className={`card border-2 ${RARITY_COLORS[c.rarity]}`}>
            <div className="text-3xl mb-2">{c.type === 'board' ? '🎯' : c.type === 'piece' ? '⚫' : '✨'}</div>
            <h3 className="font-black text-amber-800">{c.name}</h3>
            <p className="text-xs text-amber-400 capitalize mb-3">{c.type} · {c.rarity}</p>
            {c.price === 0 ? (
              <span className="text-green-600 font-bold text-sm">Free (default)</span>
            ) : owned.has(c.id) ? (
              <span className="text-green-600 font-bold text-sm">Owned</span>
            ) : (
              <button onClick={() => buy(c.id, c.price, c.name)} disabled={!!buying || !user || (user.coins < c.price)} className="btn-primary text-sm w-full disabled:opacity-50">
                {buying === c.id ? 'Buying...' : `${c.price} coins`}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card mt-8 border-2 border-amber-400 bg-amber-50">
        <div className="flex items-center gap-4">
          <div className="text-4xl">⭐</div>
          <div className="flex-1">
            <h3 className="font-black text-amber-800">Upgrade to Pro</h3>
            <p className="text-sm text-amber-600">Exclusive board themes, animated pieces, priority matchmaking, and a Pro badge on your profile.</p>
          </div>
          <button className="btn-primary">Upgrade — $4.99</button>
        </div>
      </div>
    </div>
  );
}
