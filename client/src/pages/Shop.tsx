import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../stores/auth';
import { useCosmetics } from '../stores/cosmetics';
import { useT } from '../lib/i18n';

const RARITY_BADGE: Record<string, string> = {
  legendary: 'text-yellow-400',
  epic: 'text-purple-400',
  rare: 'text-blue-400',
  common: 'text-ink-faint',
};

const TYPE_LABEL_KEYS: Record<string, 'shop.board' | 'shop.pieceSet' | 'shop.effect'> = {
  board: 'shop.board', piece: 'shop.pieceSet', fx: 'shop.effect',
};

function ShopPreview({ cosmetic }: { cosmetic: { type: string; cssClass: string } }) {
  if (cosmetic.type === 'board') {
    return (
      <div className={`board-thumb ${cosmetic.cssClass}`}>
        {Array.from({ length: 16 }).map((_, i) => {
          const r = Math.floor(i / 4);
          const c = i % 4;
          return <div key={i} className={(r + c) % 2 === 1 ? 'sq-dark' : 'sq-light'} />;
        })}
      </div>
    );
  }
  if (cosmetic.type === 'piece') {
    return (
      <div className="flex gap-3 items-center justify-center" style={{ width: 88, height: 88 }}>
        <span className={`piece-thumb ${cosmetic.cssClass}`} />
        <span
          className={`piece-thumb ${cosmetic.cssClass} flex items-center justify-center`}
          style={{ boxShadow: '0 0 14px rgba(255,200,80,0.5)' }}
        >
          <span style={{ color: '#8b6914', fontFamily: 'serif', fontSize: 18, lineHeight: 1 }}>♛</span>
        </span>
      </div>
    );
  }
  return <div className={`fx-thumb ${cosmetic.cssClass}`} />;
}

export default function Shop() {
  const { user, setUser, fetchMe, logout } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const { equippedBoard, equippedPiece, equippedFx, equip } = useCosmetics();
  const [cosmetics, setCosmetics] = useState<any[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [buying, setBuying] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    fetchMe().catch(() => {});
    api.cosmetics.list().then(setCosmetics).catch(() => {});
    api.cosmetics.owned().then((ids: string[]) => setOwned(new Set(ids))).catch(() => {});
  }, []);

  function isEquipped(cssClass: string, type: string) {
    if (type === 'board') return equippedBoard === cssClass;
    if (type === 'piece') return equippedPiece === cssClass;
    if (type === 'fx') return equippedFx === cssClass;
    return false;
  }

  async function buy(id: string, price: number, name: string) {
    if (!user) { nav('/login'); return; }
    if (user.coins < price) { setMsgType('error'); setMsg(t('shop.notEnough')); return; }
    setBuying(id);
    try {
      const { coins } = await api.cosmetics.buy(id);
      setUser({ ...user, coins: coins ?? user.coins - price });
      try {
        const freshOwned: string[] = await api.cosmetics.owned();
        setOwned(new Set(freshOwned));
      } catch {
        setOwned(prev => new Set([...prev, id]));
      }
      // Auto-equip on purchase so it's ready to use immediately
      const item = cosmetics.find(c => c.id === id);
      if (item) {
        equip(item.type as 'board' | 'piece' | 'fx', item.cssClass);
        setMsgType('success');
        setMsg(`${name} purchased and equipped!`);
      } else {
        setMsgType('success');
        setMsg(`Purchased ${name}!`);
      }
    } catch (e: any) {
      const errMsg: string = e?.error || e?.message || 'Purchase failed';
      if (e?.status === 401 || errMsg.toLowerCase().includes('session expired') || errMsg.toLowerCase().includes('log in again')) {
        logout().catch(() => {});
        nav('/login');
        return;
      }
      setMsgType('error');
      setMsg(errMsg);
    } finally {
      setBuying(null);
    }
  }

  function handleEquip(cssClass: string, type: string, name: string) {
    equip(type as 'board' | 'piece' | 'fx', cssClass);
    setMsgType('success');
    setMsg(`${name} equipped!`);
  }

  const groups = ['board', 'piece', 'fx'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink">{t('shop.title')}</h1>
          <p className="text-ink-muted text-sm">{t('shop.subtitle')}</p>
        </div>
        {user && (
          <div className="card-sm text-center">
            <p className="font-black text-coin text-lg">{user.coins}</p>
            <p className="text-xs text-ink-faint">{t('shop.coins')}</p>
          </div>
        )}
      </div>

      {msg && (
        <div className={`border rounded-lg p-3 text-sm mb-4 ${
          msgType === 'success'
            ? 'bg-accent/10 border-accent/30 text-accent'
            : 'bg-danger/10 border-danger/30 text-danger'
        }`}>{msg}</div>
      )}

      {groups.map(group => {
        const items = cosmetics.filter(c => c.type === group);
        if (!items.length) return null;
        const labelKey = TYPE_LABEL_KEYS[group];
        return (
          <div key={group} className="mb-8">
            <p className="section-title mb-3">{labelKey ? t(labelKey) : group}</p>
            <div className="grid grid-cols-2 gap-3">
              {items.map(c => {
                const isOwned = owned.has(c.id) || c.price === 0;
                const equipped = isEquipped(c.cssClass, c.type);
                return (
                  <div key={c.id} className={`card border flex flex-col gap-3 ${equipped ? 'border-accent/60 bg-accent/5' : 'border-surface-border'}`}>
                    <div className="flex justify-center pt-1">
                      <ShopPreview cosmetic={c} />
                    </div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-ink text-sm">{c.name}</h3>
                      <span className={`text-xs font-semibold capitalize ${RARITY_BADGE[c.rarity]}`}>{c.rarity}</span>
                    </div>
                    {equipped && (
                      <div className="flex items-center gap-1 text-xs text-accent font-bold">
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
                        </svg>
                        Equipped
                      </div>
                    )}
                    <div className="mt-auto pt-1 flex flex-col gap-1.5">
                      {isOwned ? (
                        <button
                          onClick={() => handleEquip(c.cssClass, c.type, c.name)}
                          className={`text-sm w-full py-1.5 rounded-lg font-bold transition-colors ${
                            equipped
                              ? 'bg-accent/20 text-accent border border-accent/40 cursor-default'
                              : 'btn-secondary'
                          }`}
                          disabled={equipped}
                        >
                          {equipped ? 'Equipped' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buy(c.id, c.price, c.name)}
                          disabled={!!buying || !user || (!!user && user.coins < c.price)}
                          className="btn-primary text-sm w-full disabled:opacity-40"
                        >
                          {buying === c.id ? t('shop.buying') : `${c.price} ${t('shop.buy')}`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="card border border-yellow-500/30 bg-yellow-500/5 mt-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-ink">{t('shop.proTitle')}</h3>
              <span className="text-xs font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">PRO</span>
            </div>
            <p className="text-sm text-ink-muted">{t('shop.proDesc')}</p>
          </div>
          <button onClick={() => nav('/pro')} className="btn-primary shrink-0">
            {t('shop.proPrice')}
          </button>
        </div>
      </div>
    </div>
  );
}
