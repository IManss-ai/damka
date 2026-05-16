import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSocket } from '../lib/socket';
import { api } from '../lib/api';

const FEATURES = [
  { icon: '🤖', title: 'AI Coach', desc: 'Post-game analysis. See exactly where you won or lost the game.', color: 'from-emerald-500/20 to-green-600/5' },
  { icon: '⚔️', title: 'Live Multiplayer', desc: 'Real-time games with friends via a shareable link. WebSocket-powered.', color: 'from-orange-500/20 to-red-600/5' },
  { icon: '🏆', title: 'Boss Rush', desc: '5 AI bosses with unique playstyles. Beat them all to unlock rare cosmetics.', color: 'from-yellow-500/20 to-amber-600/5' },
  { icon: '🌍', title: 'City Rivalries', desc: 'Your wins count for your city. Battle for regional supremacy on the global board.', color: 'from-blue-500/20 to-cyan-600/5' },
  { icon: '🧩', title: 'Daily Puzzle', desc: 'One tactical puzzle per day. Solve faster than everyone else on the leaderboard.', color: 'from-purple-500/20 to-violet-600/5' },
  { icon: '🎨', title: 'Cosmetics Shop', desc: 'Buy unique piece skins and board themes. Flex your style in every game.', color: 'from-pink-500/20 to-rose-600/5' },
];

const FLOATING_PIECES = [
  { size: 56, top: '15%', left: '8%', delay: 0, opacity: 0.25 },
  { size: 40, top: '60%', left: '5%', delay: 1.2, opacity: 0.15 },
  { size: 48, top: '30%', right: '7%', delay: 0.6, opacity: 0.2 },
  { size: 36, top: '72%', right: '4%', delay: 1.8, opacity: 0.15 },
  { size: 52, top: '82%', left: '12%', delay: 0.9, opacity: 0.12 },
];

export default function Landing() {
  const [liveGames, setLiveGames] = useState<any[]>([]);
  const [cityScores, setCityScores] = useState<any[]>([]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('lobby:join');
    socket.on('lobby:games', setLiveGames);
    socket.on('lobby:gameCreated', (g: any) => setLiveGames(p => [g, ...p].slice(0, 5)));
    socket.on('lobby:gameEnded', ({ gameId }: any) => setLiveGames(p => p.filter((g: any) => g.id !== gameId)));
    api.leaderboard.city().then(setCityScores).catch(() => {});
    return () => {
      socket.off('lobby:games');
      socket.off('lobby:gameCreated');
      socket.off('lobby:gameEnded');
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Background glow */}
      <div className="hero-gradient fixed inset-0 pointer-events-none" />

      {/* Floating decoration pieces */}
      {FLOATING_PIECES.map((p, i) => (
        <div
          key={i}
          className="fixed pointer-events-none select-none"
          style={{ top: p.top, left: (p as any).left, right: (p as any).right, opacity: p.opacity,
            animation: `float ${4 + i}s ease-in-out ${p.delay}s infinite` }}
        >
          <div
            style={{ width: p.size, height: p.size }}
            className="rounded-full bg-gradient-to-br from-accent to-accent/40 shadow-lg"
          />
        </div>
      ))}

      <div className="relative max-w-5xl mx-auto px-4 py-20">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-20"
        >
          {/* Live indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent text-xs font-bold px-4 py-1.5 rounded-full mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            {liveGames.length > 0 ? `${liveGames.length} live game${liveGames.length > 1 ? 's' : ''} happening now` : 'Be the first to play today'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-display text-7xl md:text-8xl font-black mb-4 tracking-tight leading-none"
          >
            <span className="gradient-text">Damka</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-ink-muted mb-2 max-w-lg mx-auto"
          >
            Competitive checkers, reimagined.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-ink-faint mb-10"
          >
            AI coaching · City rivalries · Boss Rush · Real-time multiplayer
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-3 justify-center"
          >
            <Link to="/register" className="btn-primary text-base px-10 py-3 text-lg">
              Start Playing Free
            </Link>
            <Link to="/leaderboard" className="btn-secondary text-base px-8 py-3">
              View Rankings
            </Link>
          </motion.div>
        </motion.div>

        {/* Live activity row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="grid md:grid-cols-2 gap-5 mb-16"
        >
          {/* Live Games */}
          <div className="card-glow">
            <h2 className="section-title flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse inline-block" />
              Live Right Now
            </h2>
            {liveGames.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="text-3xl mb-2">⚔️</div>
                <p className="text-ink-muted text-sm">No active games yet.</p>
                <p className="text-ink-faint text-xs mt-1">Start one and challenge your rivals.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {liveGames.map((g: any) => (
                  <Link key={g.id} to={`/game/${g.id}`}
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-surface-raised rounded-lg text-sm transition-all group border border-transparent hover:border-border">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent/60 group-hover:bg-accent transition-colors" />
                      <span className="font-semibold text-ink">{g.whiteUsername}</span>
                      <span className="text-ink-faint text-xs">vs</span>
                      <span className="font-semibold text-ink">{g.blackUsername || '...'}</span>
                    </div>
                    <span className="text-ink-faint text-xs">{g.spectators > 0 && `${g.spectators} watching`}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* City Rivalry */}
          <div className="card-glow">
            <h2 className="section-title">🌍 City Rivalry This Week</h2>
            {cityScores.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="text-3xl mb-2">🌍</div>
                <p className="text-ink-muted text-sm">No scores yet this week.</p>
                <p className="text-ink-faint text-xs mt-1">Be the first to represent your city.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {cityScores.slice(0, 5).map((s: any, i: number) => (
                  <div key={s.city} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-raised transition-colors">
                    <span className={`font-black text-sm w-6 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-ink-faint'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <span className="font-semibold text-ink flex-1">{s.city}</span>
                    <span className="text-accent text-sm font-bold">{s.totalPoints} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <h2 className="text-center text-sm font-bold text-ink-muted uppercase tracking-widest mb-8">
            Everything you need to compete
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.07 }}
                className={`card-glow bg-gradient-to-br ${f.color} cursor-default group`}
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200 inline-block">{f.icon}</div>
                <h3 className="font-bold text-ink text-base mb-1">{f.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-20"
        >
          <div className="card-glow max-w-lg mx-auto py-12">
            <div className="text-4xl mb-4">♟️</div>
            <h2 className="font-display text-2xl font-black text-ink mb-2">Ready to compete?</h2>
            <p className="text-ink-muted text-sm mb-6">Join players from across Kazakhstan. Prove your city is the best.</p>
            <Link to="/register" className="btn-primary px-12 py-3 text-base">
              Create Free Account
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
