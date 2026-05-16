import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FREE_FEATURES = [
  '500 coins on signup',
  'All standard boards and pieces',
  'Multiplayer & ranked games',
  'Boss Rush campaign',
  'Daily puzzles',
  'AI Coach analysis (1 per day)',
  'City leaderboard',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Animated piece sets',
  '8 exclusive Pro board themes',
  'PRO badge on your profile',
  'Priority matchmaking (no wait)',
  'Unlimited AI Coach analyses',
  'Detailed game statistics',
  '1000 bonus coins/month',
  'Early access to new features',
];

export default function Pro() {
  const nav = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5">
          <span className="text-yellow-400 font-black text-xs tracking-widest uppercase">Pro Membership</span>
        </div>
        <h1 className="text-3xl font-black text-ink mb-3">Upgrade to Damka Pro</h1>
        <p className="text-ink-muted text-sm max-w-md mx-auto">
          The serious player's toolkit. More boards, unlimited coaching, priority matchmaking — everything you need to climb.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {/* Free */}
        <div className="card border border-surface-border">
          <div className="mb-4">
            <p className="text-xs font-bold text-ink-faint uppercase tracking-widest mb-1">Free</p>
            <p className="text-3xl font-black text-ink">$0</p>
            <p className="text-xs text-ink-faint">forever</p>
          </div>
          <ul className="space-y-2 mb-6">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-xs text-ink-muted">
                <span className="text-accent mt-0.5 shrink-0">+</span>
                {f}
              </li>
            ))}
          </ul>
          <button onClick={() => nav('/register')} className="btn-secondary w-full text-sm">
            Get Started Free
          </button>
        </div>

        {/* Pro */}
        <div className="card border-2 border-yellow-400/50 bg-yellow-400/5 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              Best Value
            </span>
          </div>
          <div className="mb-4">
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1">Pro</p>
            <p className="text-3xl font-black text-ink">$4.99</p>
            <p className="text-xs text-ink-faint">per month</p>
          </div>
          <ul className="space-y-2 mb-6">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-xs text-ink-muted">
                <span className="text-yellow-400 mt-0.5 shrink-0 font-bold">+</span>
                {f}
              </li>
            ))}
          </ul>
          <button onClick={() => setShowModal(true)} className="w-full py-2.5 rounded-lg font-bold text-sm bg-yellow-400 text-black hover:bg-yellow-300 transition-colors">
            Upgrade to Pro
          </button>
        </div>
      </div>

      {/* Social proof */}
      <div className="card border border-surface-border text-center mb-6">
        <p className="text-xs text-ink-faint mb-1">Trusted by players from</p>
        <div className="flex items-center justify-center gap-4 text-sm font-semibold text-ink-muted">
          <span>Almaty</span>
          <span className="text-surface-border">·</span>
          <span>Astana</span>
          <span className="text-surface-border">·</span>
          <span>Shymkent</span>
          <span className="text-surface-border">·</span>
          <span>Karaganda</span>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <p className="section-title">FAQ</p>
        {[
          { q: 'Can I cancel anytime?', a: 'Yes. Cancel before your next billing date and you keep Pro access until the period ends.' },
          { q: 'Is my data safe?', a: 'All game data is stored securely. Canceling Pro does not delete your account or game history.' },
          { q: 'What payment methods are accepted?', a: 'Visa, Mastercard, and Kaspi QR. More methods coming soon.' },
        ].map(({ q, a }) => (
          <div key={q} className="card-sm">
            <p className="font-semibold text-ink text-sm mb-1">{q}</p>
            <p className="text-xs text-ink-muted">{a}</p>
          </div>
        ))}
      </div>

      {/* Upgrade modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="card max-w-sm w-full border border-yellow-400/30" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-ink mb-1">Upgrade to Pro</h2>
            <p className="text-xs text-ink-muted mb-6">Secure checkout via Kaspi or card. Cancel anytime.</p>
            <div className="bg-surface-raised rounded-lg p-4 text-center mb-6 border border-surface-border">
              <p className="text-ink font-bold mb-1">Damka Pro — $4.99/month</p>
              <p className="text-xs text-ink-faint">Billed monthly. No commitment.</p>
            </div>
            <div className="space-y-2 mb-4">
              <input className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent" placeholder="Card number" />
              <div className="flex gap-2">
                <input className="flex-1 bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent" placeholder="MM/YY" />
                <input className="w-20 bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent" placeholder="CVV" />
              </div>
            </div>
            <button
              onClick={() => { setShowModal(false); alert('Payment processing coming soon! Thank you for your interest.'); }}
              className="w-full py-2.5 rounded-lg font-bold text-sm bg-yellow-400 text-black hover:bg-yellow-300 transition-colors mb-2"
            >
              Subscribe — $4.99/mo
            </button>
            <button onClick={() => setShowModal(false)} className="btn-secondary w-full text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
