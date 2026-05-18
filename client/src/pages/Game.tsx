import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSocket } from '../lib/socket';
import { useAuth } from '../stores/auth';
import { sfx } from '../lib/sounds';
import { launchConfetti } from '../lib/confetti';
import Board from '../components/Board';
import { useSquareSize } from '../lib/useSquareSize';

interface GameStats { moves: number; captures: number; durationSec: number; whiteEloDelta: number; blackEloDelta: number; }
interface GameState { board: any[][]; currentTurn: string; result: string; moveHistory: any[]; whitePieces: number; blackPieces: number; }

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [state, setState] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<any[]>([]);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [opponentName, setOpponentName] = useState('...');
  const [spectators, setSpectators] = useState(0);
  const [result, setResult] = useState<{ result: string; story: string; stats?: GameStats } | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [lastMove, setLastMove] = useState<any>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [whiteTimeMs, setWhiteTimeMs] = useState<number | null>(null);
  const [blackTimeMs, setBlackTimeMs] = useState<number | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevPiecesRef = useRef<{ white: number; black: number } | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const suppressNextSoundRef = useRef(false);

  const squareSize = useSquareSize();
  const socket = getSocket();

  useEffect(() => {
    if (!id || !user) return;
    socket.emit('game:requestState', { gameId: id, userId: user.id, username: user.username });

    socket.on('game:currentState', ({ state: s, whiteUsername, blackUsername, playerColor: pc, isSpectator: spec, spectators: specCount, whiteTimeMs: wtm, blackTimeMs: btm }) => {
      setState(s);
      setPlayerColor(pc || 'white');
      setIsSpectator(spec);
      setSpectators(specCount || 0);
      setWaitingForOpponent(!blackUsername && !spec);
      const myName = user?.username;
      setOpponentName(myName === whiteUsername ? (blackUsername || 'Waiting...') : whiteUsername);
      if (!blackUsername && !spec) setShareLink(window.location.origin + `/game/${id}`);
      if (wtm !== undefined) { setWhiteTimeMs(wtm); setBlackTimeMs(btm); }
    });

    socket.on('game:started', ({ state: s, whiteUsername, blackUsername }) => {
      setState(s);
      setWaitingForOpponent(false);
      const myName = user?.username;
      setOpponentName(myName === whiteUsername ? (blackUsername || '...') : whiteUsername);
      sfx.tick();
    });

    socket.on('game:notFound', () => nav('/play'));

    socket.on('game:stateUpdate', ({ state: s, lastMove: lm, whiteTimeMs: wtm, blackTimeMs: btm }) => {
      if (wtm !== undefined) { setWhiteTimeMs(wtm); setBlackTimeMs(btm); }
      const prev = prevPiecesRef.current;
      if (prev) {
        if (suppressNextSoundRef.current) {
          // Local animation already played the sound — skip server's duplicate
          suppressNextSoundRef.current = false;
        } else {
          const whiteLost = prev.white > s.whitePieces;
          const blackLost = prev.black > s.blackPieces;
          if (whiteLost || blackLost) {
            sfx.capture();
          } else {
            sfx.move();
          }
        }
        // Check for new king
        if (lm) {
          const piece = s.board[lm.to.row]?.[lm.to.col];
          if (piece?.type === 'king') {
            setTimeout(() => sfx.king(), 100);
          }
        }
      }
      prevPiecesRef.current = { white: s.whitePieces, black: s.blackPieces };
      setState(s);
      setLastMove(lm);
      setSelected(null);
      setLegalMoves([]);
    });

    socket.on('game:legalMovesResult', ({ moves }) => setLegalMoves(moves));
    socket.on('game:spectators', ({ count }) => setSpectators(count));
    socket.on('game:aiThinking', ({ thinking }: { thinking: boolean }) => setAiThinking(thinking));

    socket.on('game:ended', (data) => {
      setResult(data);
      const won = data.result !== 'draw' && data.result.includes('white') === (playerColor === 'white');
      if (won) {
        sfx.win();
        // Launch confetti
        const canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
        launchConfetti(canvas);
      } else if (data.result !== 'draw') {
        sfx.lose();
      } else {
        sfx.tick();
      }
    });

    return () => {
      socket.off('game:currentState'); socket.off('game:started'); socket.off('game:notFound');
      socket.off('game:stateUpdate'); socket.off('game:legalMovesResult');
      socket.off('game:spectators'); socket.off('game:ended'); socket.off('game:aiThinking');
    };
  }, [id, user?.id]);

  // Track piece counts
  useEffect(() => {
    if (state) {
      prevPiecesRef.current = { white: state.whitePieces, black: state.blackPieces };
    }
  }, []);

  // Client-side clock countdown (smooth display between server updates)
  useEffect(() => {
    if (whiteTimeMs === null || !state || state.result !== 'ongoing') {
      if (clockRef.current) clearInterval(clockRef.current);
      return;
    }
    if (clockRef.current) clearInterval(clockRef.current);
    clockRef.current = setInterval(() => {
      if (state.currentTurn === 'white') {
        setWhiteTimeMs(prev => (prev !== null ? Math.max(0, prev - 100) : null));
      } else {
        setBlackTimeMs(prev => (prev !== null ? Math.max(0, prev - 100) : null));
      }
    }, 100);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, [state?.currentTurn, whiteTimeMs !== null]);

  // For multi-capture chains: derive the order each enemy gets jumped.
  // Works for man pieces (always 1 diagonal step between current and enemy).
  // Returns one entry per capture; final landing should equal target.to.
  function orderManCaptures(
    from: { row: number; col: number },
    captures: { row: number; col: number }[],
  ): { cap: { row: number; col: number }; landing: { row: number; col: number } }[] {
    const remaining = captures.map(c => ({ row: c.row, col: c.col }));
    let cur = { row: from.row, col: from.col };
    const result: { cap: { row: number; col: number }; landing: { row: number; col: number } }[] = [];
    while (remaining.length > 0) {
      const idx = remaining.findIndex(c =>
        Math.abs(c.row - cur.row) === 1 && Math.abs(c.col - cur.col) === 1,
      );
      if (idx === -1) break;
      const c = remaining.splice(idx, 1)[0];
      const dr = Math.sign(c.row - cur.row);
      const dc = Math.sign(c.col - cur.col);
      const landing = { row: c.row + dr, col: c.col + dc };
      result.push({ cap: c, landing });
      cur = landing;
    }
    return result;
  }

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!state || !user || state.result !== 'ongoing' || isSpectator) return;
    if (state.currentTurn !== playerColor) return;
    const piece = state.board[row]?.[col];
    if (selected) {
      const target = legalMoves.find(m => m.to.row === row && m.to.col === col);
      if (target) {
        const isMultiJump = (target.captures?.length ?? 0) >= 2;
        const waypoints = isMultiJump ? orderManCaptures(target.from, target.captures) : [];

        if (isMultiJump && waypoints.length === target.captures.length) {
          // Multi-jump: animate piece through each landing square, removing one captured
          // piece per hop. Suppress the server's duplicate sound on stateUpdate.
          const HOP_MS = 240;
          suppressNextSoundRef.current = true;

          waypoints.forEach((wp, i) => {
            // Start from (i+1)*HOP_MS so the first hop has a visible delay,
            // giving the browser time to paint the pre-move state first.
            setTimeout(() => {
              setState(prev => {
                if (!prev) return prev;
                const b = prev.board.map((r: any[]) => r.map((p: any) => (p ? { ...p } : null)));
                const src = i === 0 ? target.from : waypoints[i - 1].landing;
                const movingPiece = b[src.row]?.[src.col];
                if (movingPiece) {
                  b[src.row][src.col] = null;
                  movingPiece.row = wp.landing.row;
                  movingPiece.col = wp.landing.col;
                  b[wp.landing.row][wp.landing.col] = movingPiece;
                }
                b[wp.cap.row][wp.cap.col] = null;
                return { ...prev, board: b };
              });
              setLastMove({ from: i === 0 ? target.from : waypoints[i - 1].landing, to: wp.landing });
              sfx.capture();
            }, (i + 1) * HOP_MS);
          });

          // Emit after all hops have completed so server stateUpdate arrives
          // after the visual animation finishes.
          setTimeout(() => {
            socket.emit('game:move', { gameId: id, move: target, userId: user.id });
          }, (waypoints.length + 1) * HOP_MS);
        } else {
          // Single-step move (or king edge case) — optimistic teleport, server confirms.
          const optimisticBoard = state.board.map((r: any[]) => r.map((p: any) => (p ? { ...p } : null)));
          const movingPiece = optimisticBoard[target.from.row]?.[target.from.col];
          if (movingPiece) {
            optimisticBoard[target.from.row][target.from.col] = null;
            movingPiece.row = target.to.row;
            movingPiece.col = target.to.col;
            optimisticBoard[target.to.row][target.to.col] = movingPiece;
            for (const cap of target.captures) optimisticBoard[cap.row][cap.col] = null;
            setState(s => (s ? { ...s, board: optimisticBoard } : s));
            setLastMove({ from: target.from, to: target.to });
          }
          socket.emit('game:move', { gameId: id, move: target, userId: user.id });
        }
        setSelected(null);
        setLegalMoves([]);
        return;
      }
    }
    if (piece && piece.color === playerColor) {
      sfx.select();
      setSelected({ row, col });
      socket.emit('game:legalMoves', { gameId: id, row, col });
    } else {
      setSelected(null);
      setLegalMoves([]);
    }
  }, [state, selected, legalMoves, playerColor, user, id, isSpectator]);

  function confirmResign() {
    if (!user) return;
    socket.emit('game:resign', { gameId: id, userId: user.id });
    setShowResignConfirm(false);
  }

  function fmtDuration(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }

  async function fetchAiAnalysis() {
    if (!state || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moveHistory: state.moveHistory,
          result: result?.result,
          playerColor,
          whitePieces: state.whitePieces,
          blackPieces: state.blackPieces,
        }),
      });
      const data = await res.json();
      setAiAnalysis(data.analysis || 'AI coach is unavailable right now. Great game though!');
    } catch {
      setAiAnalysis('AI coach is unavailable right now. Great game though!');
    } finally {
      setAiLoading(false);
    }
  }

  function fmtTime(ms: number | null) {
    if (ms === null) return '';
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, '0')}`;
  }

  const isMyTurn = state?.currentTurn === playerColor && !isSpectator;
  const myPieces  = playerColor === 'white' ? state?.whitePieces : state?.blackPieces;
  const oppPieces = playerColor === 'white' ? state?.blackPieces : state?.whitePieces;

  // Evaluation bar: score from -1 (black dominating) to +1 (white dominating)
  function evalScore(s: GameState) {
    const flat = s.board.flat();
    const wKings = flat.filter(p => p?.color === 'white' && p?.type === 'king').length;
    const bKings = flat.filter(p => p?.color === 'black' && p?.type === 'king').length;
    const wScore = s.whitePieces + 0.5 * wKings;
    const bScore = s.blackPieces + 0.5 * bKings;
    const total = wScore + bScore;
    return total === 0 ? 0 : (wScore - bScore) / total;
  }
  const evalVal = state ? evalScore(state) : 0; // -1..+1, positive = white ahead
  // For the bar: white is at bottom. whitePercent = how much of bar is white.
  const whiteBarPct = Math.round(((evalVal + 1) / 2) * 100); // 0..100, 50 = equal

  /* ---- Not logged in ---- */
  if (!user) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glow">
        <h2 className="font-display text-xl font-black text-ink mb-2">Войдите чтобы играть</h2>
        <p className="text-ink-muted text-sm mb-6">Создайте аккаунт или войдите, чтобы сыграть с другом.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/login" className="btn-primary">Войти</Link>
          <Link to="/register" className="btn-secondary">Регистрация</Link>
        </div>
      </motion.div>
    </div>
  );

  /* ---- Result screen ---- */
  if (result) {
    const won  = result.result !== 'draw' && result.result.includes('white') === (playerColor === 'white');
    const draw = result.result === 'draw';
    const stats = result.stats;
    const myEloDelta = stats ? (playerColor === 'white' ? stats.whiteEloDelta : stats.blackEloDelta) : 0;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Main result card */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="card-glow text-center mb-4"
          >
            {/* Outcome badge */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 }}
              className={`inline-block px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4 ${
                draw ? 'bg-surface-raised text-ink-muted border border-border'
                : won ? 'bg-accent/20 text-accent border border-accent/40'
                : 'bg-danger/20 text-danger border border-danger/40'
              }`}
            >
              {draw ? 'Draw' : won ? 'Victory' : 'Defeat'}
            </motion.div>

            {/* Big result text */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`font-display text-5xl font-black mb-2 ${
                draw ? 'text-ink-muted' : won ? 'text-accent' : 'text-ink'
              }`}
            >
              {draw ? 'Evenly Matched' : won ? 'Well Played!' : 'Good Fight'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-ink-muted text-sm italic mb-6 leading-relaxed px-4"
            >
              "{result.story}"
            </motion.p>

            {/* ELO change — prominent */}
            {myEloDelta !== 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.35 }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl mb-5 font-black text-xl ${
                  myEloDelta > 0
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-danger/15 text-danger border border-danger/30'
                }`}
              >
                <span>{myEloDelta > 0 ? '+' : ''}{myEloDelta}</span>
                <span className="text-sm font-semibold opacity-70">ELO</span>
              </motion.div>
            )}

            {/* Stats grid */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-2 mb-6"
              >
                {[
                  { label: 'Moves', value: stats.moves },
                  { label: 'Captures', value: stats.captures },
                  { label: 'Time', value: fmtDuration(stats.durationSec) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-raised border border-border rounded-xl py-3">
                    <p className="text-xs text-ink-faint mb-1">{label}</p>
                    <p className="font-black text-ink text-lg">{value}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Link to="/play" className="btn-primary flex-1">Play Again</Link>
              <Link to="/leaderboard" className="btn-secondary flex-1">Rankings</Link>
            </div>
          </motion.div>

          {/* AI Coach card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-surface-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-accent">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 5v5l3 3" />
                </svg>
              </div>
              <span className="text-sm font-bold text-ink">AI Coach</span>
              <span className="ml-auto text-xs text-ink-faint">Free analysis</span>
            </div>

            {!aiAnalysis && !aiLoading && (
              <div>
                <p className="text-xs text-ink-muted mb-3">Get instant feedback on your game — what you did well and what to improve.</p>
                <button onClick={fetchAiAnalysis} className="btn-primary w-full text-sm py-2.5">
                  Analyze My Game
                </button>
              </div>
            )}

            {aiLoading && (
              <div className="flex items-center gap-3 py-2">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-medium text-ink">Analyzing your game...</p>
                  <p className="text-xs text-ink-faint">Looking for tactical patterns</p>
                </div>
              </div>
            )}

            {aiAnalysis && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-sm text-ink-muted leading-relaxed">{aiAnalysis}</p>
                <button
                  onClick={() => { setAiAnalysis(null); }}
                  className="mt-3 text-xs text-ink-faint hover:text-ink transition-colors"
                >
                  Clear
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Home link */}
          <div className="text-center mt-4">
            <Link to="/" className="text-xs text-ink-faint hover:text-ink transition-colors">Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Waiting screen ---- */
  if (waitingForOpponent) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glow"
      >
        <div className="text-lg font-black text-ink-muted mb-4 uppercase tracking-widest">Waiting</div>
        <h2 className="font-display text-xl font-black text-ink mb-2">Waiting for opponent</h2>
        <p className="text-ink-muted text-sm mb-2">Share this link with your friend:</p>
        <p className="text-ink-faint text-xs mb-4">Your friend must be logged in to join.</p>
        <div className="bg-surface-nav border border-border rounded-xl p-3 text-xs font-mono break-all mb-4 text-ink-muted select-all">{shareLink}</div>
        <button onClick={() => { navigator.clipboard.writeText(shareLink); sfx.tick(); }} className="btn-primary w-full mb-3">
          Copy Link
        </button>
        <div className="relative flex items-center my-4">
          <div className="flex-1 border-t border-border" />
          <span className="px-3 text-xs text-ink-faint">or</span>
          <div className="flex-1 border-t border-border" />
        </div>
        <p className="text-ink-muted text-sm mb-3">No one available? Play against a bot:</p>
        <div className="flex gap-2 justify-center">
          {(['easy', 'medium', 'hard'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => { socket.emit('game:addBot', { gameId: id, difficulty: diff }); sfx.tick(); }}
              className="btn-secondary flex-1 capitalize text-sm"
            >
              {diff}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  /* ---- Loading screen ---- */
  if (!state) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
      <div className="text-ink-muted text-sm">Connecting to game...</div>
    </div>
  );

  const myProgress = ((myPieces ?? 12) / 12) * 100;
  const oppProgress = ((oppPieces ?? 12) / 12) * 100;

  /* ---- Game board ---- */
  const boardPx = squareSize * 8;

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 items-center xl:items-start justify-center">

        {/* Board column — width locked to board size so player bars match */}
        <div className="animate-board-entrance flex-shrink-0" style={{ width: boardPx }}>
          {/* Opponent bar */}
          <div className="flex items-center justify-between mb-2 bg-surface-card border border-border rounded-xl px-3 py-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-surface-raised border border-border flex items-center justify-center text-xs font-bold text-ink shrink-0">
                {opponentName[0]?.toUpperCase() || '?'}
              </div>
              <span className="font-semibold text-ink text-xs truncate">{opponentName}</span>
              {aiThinking && (
                <span className="flex items-center gap-1 ml-1 shrink-0" aria-label="Opponent is thinking">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '160ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '320ms' }} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {whiteTimeMs !== null && (
                <span className={`font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 rounded ${
                  state?.currentTurn !== playerColor
                    ? 'bg-accent/15 text-accent animate-pulse'
                    : 'text-ink-muted'
                }`}>
                  {fmtTime(playerColor === 'white' ? blackTimeMs : whiteTimeMs)}
                </span>
              )}
              <div className="hidden sm:flex gap-0.5">
                {Array.from({ length: oppPieces ?? 0 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${playerColor === 'white' ? 'bg-[#2c2826]' : 'bg-[#e8d9b8]'}`} />
                ))}
              </div>
              <span className="text-xs text-ink-muted font-mono w-4 text-right">{oppPieces}</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Board board={state.board} selectedPiece={selected} legalMoves={legalMoves}
              onSquareClick={handleSquareClick} playerColor={playerColor} lastMove={lastMove} squareSize={squareSize} />
          </div>

          {/* My bar */}
          <div className="flex items-center justify-between mt-2 bg-surface-card border border-border rounded-xl px-3 py-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                {user?.username?.[0]?.toUpperCase() || 'Y'}
              </div>
              <span className="font-semibold text-ink text-xs truncate">{isSpectator ? 'Spectating' : (user?.username || 'You')}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {whiteTimeMs !== null && (
                <span className={`font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 rounded ${
                  isMyTurn
                    ? 'bg-accent/15 text-accent animate-pulse'
                    : 'text-ink-muted'
                }`}>
                  {fmtTime(playerColor === 'white' ? whiteTimeMs : blackTimeMs)}
                </span>
              )}
              {isMyTurn && state.result === 'ongoing' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs bg-accent/15 text-accent px-1.5 py-0.5 rounded-full font-bold border border-accent/25"
                >
                  Your turn
                </motion.span>
              )}
              <div className="hidden sm:flex gap-0.5">
                {Array.from({ length: myPieces ?? 0 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${playerColor === 'white' ? 'bg-[#e8d9b8]' : 'bg-[#2c2826]'}`} />
                ))}
              </div>
              <span className="text-xs text-ink-muted font-mono w-4 text-right">{myPieces}</span>
            </div>
          </div>
        </div>

        {/* Sidebar — side panel on XL, 2-col grid below board on mobile */}
        <div className="w-full xl:w-52 xl:space-y-3 xl:shrink-0 max-w-xl xl:max-w-none">
          {/* Mobile: 2-col grid for compact sidebar; desktop: same children stack vertically */}
          <div className="grid grid-cols-2 gap-2 xl:flex xl:flex-col xl:space-y-3 xl:gap-0">

          {spectators > 0 && (
            <div className="card-sm text-center text-xs text-ink-muted col-span-2 xl:col-span-1">
              {spectators} watching
            </div>
          )}

          {/* Turn indicator */}
          <div className="card-sm">
            <p className="section-title">Game Status</p>
            <div className={`text-xs font-semibold px-3 py-2 rounded-lg text-center ${
              state.currentTurn === playerColor
                ? 'bg-accent/15 text-accent border border-accent/25'
                : 'bg-surface-raised text-ink-muted border border-border'
            }`}>
              {state.currentTurn === playerColor ? 'Your turn' : `${opponentName}'s turn`}
            </div>
          </div>

          {/* Evaluation Bar */}
          <div className="card-sm">
            <p className="section-title mb-2">Position</p>
            <div className="flex gap-3 items-stretch">
              <div className="flex flex-col w-5 rounded overflow-hidden border border-surface-border" style={{ height: 80 }}>
                <div className="transition-all duration-700" style={{ height: `${100 - whiteBarPct}%`, background: '#2c2826' }} />
                <div className="transition-all duration-700" style={{ height: `${whiteBarPct}%`, background: '#e8d9b8' }} />
              </div>
              <div className="flex flex-col justify-between text-xs py-0.5">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#2c2826] border border-[#5e564e]" />
                  <span className="text-ink-faint">{oppPieces}</span>
                </div>
                <div className="text-center text-ink-faint font-mono text-[10px]">
                  {evalVal > 0.05 ? `+${(evalVal * 100).toFixed(0)}` : evalVal < -0.05 ? `${(evalVal * 100).toFixed(0)}` : '='}
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#e8d9b8] border border-[#b89050]" />
                  <span className="text-ink-faint">{myPieces}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Move History */}
          <div className="card-sm col-span-2 xl:col-span-1">
            <p className="section-title">Move History</p>
            <div className="max-h-36 xl:max-h-52 overflow-y-auto space-y-0.5 scrollbar-thin">
              {state.moveHistory.length === 0 && (
                <div className="text-xs text-ink-faint py-2 text-center">No moves yet</div>
              )}
              {state.moveHistory.slice(-14).map((m: any, i: number) => {
                const idx = state.moveHistory.length - Math.min(14, state.moveHistory.length) + i;
                return (
                  <div key={i} className={`text-xs font-mono flex items-center gap-1 px-1 py-0.5 rounded ${
                    i === state.moveHistory.slice(-14).length - 1 ? 'bg-accent/10 text-accent' : 'text-ink-muted'
                  }`}>
                    <span className="text-ink-faint w-5 text-right shrink-0">{idx + 1}.</span>
                    <span>{m.from.row},{m.from.col}→{m.to.row},{m.to.col}</span>
                    {m.captures?.length > 0 && <span className="text-danger ml-auto">×{m.captures.length}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          </div>{/* end grid */}

          {!isSpectator && state.result === 'ongoing' && (
            <button
              onClick={() => setShowResignConfirm(true)}
              className="btn-danger w-full text-sm py-2 mt-2 xl:mt-0">
              Resign
            </button>
          )}
        </div>
      </div>

      {/* Resign confirmation modal */}
      {showResignConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowResignConfirm(false)}>
          <div className="card max-w-sm w-full border border-danger/30" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-ink mb-2">Resign this game?</h2>
            <p className="text-sm text-ink-muted mb-6">
              Your opponent will be awarded the win and your ELO will be deducted. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowResignConfirm(false)} className="btn-secondary flex-1 text-sm">
                Keep playing
              </button>
              <button onClick={confirmResign} className="btn-danger flex-1 text-sm">
                Resign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
