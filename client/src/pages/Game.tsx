import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../lib/socket';
import { useAuth } from '../stores/auth';
import { sfx } from '../lib/sounds';
import { launchConfetti } from '../lib/confetti';
import Board from '../components/Board';

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
  const [result, setResult] = useState<{ result: string; story: string } | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [lastMove, setLastMove] = useState<any>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevPiecesRef = useRef<{ white: number; black: number } | null>(null);

  const socket = getSocket();

  useEffect(() => {
    if (!id) return;
    socket.emit('game:requestState', { gameId: id, userId: user?.id });

    socket.on('game:currentState', ({ state: s, whiteUsername, blackUsername, playerColor: pc, isSpectator: spec, spectators: specCount }) => {
      setState(s);
      setPlayerColor(pc || 'white');
      setIsSpectator(spec);
      setSpectators(specCount || 0);
      setWaitingForOpponent(!blackUsername && !spec);
      const myName = user?.username;
      setOpponentName(myName === whiteUsername ? (blackUsername || 'Waiting...') : whiteUsername);
      if (!blackUsername && !spec) setShareLink(window.location.origin + `/game/${id}`);
    });

    socket.on('game:started', ({ state: s, whiteUsername, blackUsername }) => {
      setState(s);
      setWaitingForOpponent(false);
      const myName = user?.username;
      setOpponentName(myName === whiteUsername ? (blackUsername || '...') : whiteUsername);
      sfx.tick();
    });

    socket.on('game:notFound', () => nav('/play'));

    socket.on('game:stateUpdate', ({ state: s, lastMove: lm }) => {
      const prev = prevPiecesRef.current;
      if (prev) {
        const whiteLost = prev.white > s.whitePieces;
        const blackLost = prev.black > s.blackPieces;
        if (whiteLost || blackLost) {
          sfx.capture();
        } else {
          sfx.move();
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
      socket.off('game:spectators'); socket.off('game:ended');
    };
  }, [id, user?.id]);

  // Track piece counts
  useEffect(() => {
    if (state) {
      prevPiecesRef.current = { white: state.whitePieces, black: state.blackPieces };
    }
  }, []);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!state || !user || state.result !== 'ongoing' || isSpectator) return;
    if (state.currentTurn !== playerColor) return;
    const piece = state.board[row]?.[col];
    if (selected) {
      const target = legalMoves.find(m => m.to.row === row && m.to.col === col);
      if (target) {
        socket.emit('game:move', { gameId: id, move: target, userId: user.id });
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
      setAiAnalysis(data.analysis);
    } catch {
      setAiAnalysis('AI coach is unavailable right now. Great game though!');
    } finally {
      setAiLoading(false);
    }
  }

  const isMyTurn = state?.currentTurn === playerColor && !isSpectator;
  const myPieces  = playerColor === 'white' ? state?.whitePieces : state?.blackPieces;
  const oppPieces = playerColor === 'white' ? state?.blackPieces : state?.whitePieces;

  /* ---- Result screen ---- */
  if (result) {
    const won  = result.result !== 'draw' && result.result.includes('white') === (playerColor === 'white');
    const draw = result.result === 'draw';
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="card-glow"
        >
          <div className="text-7xl mb-4">
            {draw ? '🤝' : won ? '🏆' : '💀'}
          </div>
          <h2 className={`font-display text-3xl font-black mb-2 ${draw ? 'text-ink' : won ? 'gradient-text' : 'text-danger'}`}>
            {draw ? 'Draw!' : won ? 'Victory!' : 'Defeated'}
          </h2>
          <p className="text-ink-muted italic mb-2 text-sm leading-relaxed max-w-xs mx-auto">"{result.story}"</p>

          {/* AI Analysis */}
          <div className="mt-6 mb-6">
            {!aiAnalysis && !aiLoading && (
              <button onClick={fetchAiAnalysis} className="btn-primary w-full">
                🤖 Analyze with AI Coach
              </button>
            )}
            {aiLoading && (
              <div className="bg-surface-raised border border-border rounded-xl p-4 text-left">
                <div className="flex items-center gap-3 text-accent">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">AI Coach is analyzing your game...</span>
                </div>
              </div>
            )}
            {aiAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-raised border border-accent/30 rounded-xl p-4 text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <span className="text-xs font-bold text-accent uppercase tracking-widest">AI Coach Analysis</span>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
              </motion.div>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Link to="/play" className="btn-primary">Play Again</Link>
            <Link to="/" className="btn-secondary">Home</Link>
          </div>
        </motion.div>
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
        <div className="text-4xl mb-4 animate-float inline-block">⚔️</div>
        <h2 className="font-display text-xl font-black text-ink mb-2">Waiting for opponent</h2>
        <p className="text-ink-muted text-sm mb-4">Share this link with your friend:</p>
        <div className="bg-surface-nav border border-border rounded-xl p-3 text-xs font-mono break-all mb-4 text-ink-muted select-all">{shareLink}</div>
        <button onClick={() => { navigator.clipboard.writeText(shareLink); sfx.tick(); }} className="btn-primary">
          Copy Link
        </button>
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
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex gap-6 items-start justify-center">

        {/* Board column */}
        <div>
          {/* Opponent bar */}
          <div className="flex items-center justify-between mb-2 bg-surface-card border border-border rounded-xl px-4 py-2.5 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center text-sm font-bold text-ink">
                {opponentName[0]?.toUpperCase() || '?'}
              </div>
              <span className="font-semibold text-ink text-sm">{opponentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: oppPieces ?? 0 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${playerColor === 'white' ? 'bg-[#2c2826]' : 'bg-[#e8d9b8]'}`} />
                ))}
              </div>
              <span className="text-xs text-ink-muted font-mono w-4 text-right">{oppPieces}</span>
            </div>
          </div>

          <Board board={state.board} selectedPiece={selected} legalMoves={legalMoves}
            onSquareClick={handleSquareClick} playerColor={playerColor} lastMove={lastMove} />

          {/* My bar */}
          <div className="flex items-center justify-between mt-2 bg-surface-card border border-border rounded-xl px-4 py-2.5 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-sm font-bold text-accent">
                {user?.username?.[0]?.toUpperCase() || 'Y'}
              </div>
              <span className="font-semibold text-ink text-sm">{isSpectator ? 'Spectating' : (user?.username || 'You')}</span>
            </div>
            <div className="flex items-center gap-2">
              {isMyTurn && state.result === 'ongoing' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-bold border border-accent/25 animate-pulse-glow"
                >
                  Your turn
                </motion.span>
              )}
              <div className="flex gap-0.5">
                {Array.from({ length: myPieces ?? 0 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${playerColor === 'white' ? 'bg-[#e8d9b8]' : 'bg-[#2c2826]'}`} />
                ))}
              </div>
              <span className="text-xs text-ink-muted font-mono w-4 text-right">{myPieces}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-52 space-y-3 shrink-0">
          {spectators > 0 && (
            <div className="card-sm text-center text-xs text-ink-muted">
              👁 {spectators} watching
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
              {state.currentTurn === playerColor ? '⚡ Your turn' : `⏳ ${opponentName}'s turn`}
            </div>
          </div>

          {/* Move History */}
          <div className="card-sm">
            <p className="section-title">Move History</p>
            <div className="max-h-52 overflow-y-auto space-y-0.5 scrollbar-thin">
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

          {/* Piece balance bar */}
          <div className="card-sm">
            <p className="section-title">Material</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink-muted w-4">{myPieces}</span>
                <div className="flex-1 h-2 bg-surface-base rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${myProgress}%` }} />
                </div>
                <span className="text-ink-faint w-4 text-right">You</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink-muted w-4">{oppPieces}</span>
                <div className="flex-1 h-2 bg-surface-base rounded-full overflow-hidden">
                  <div className="h-full bg-surface-raised rounded-full transition-all duration-500"
                    style={{ width: `${oppProgress}%` }} />
                </div>
                <span className="text-ink-faint text-right" style={{ width: '2rem' }}>Opp</span>
              </div>
            </div>
          </div>

          {!isSpectator && state.result === 'ongoing' && (
            <button
              onClick={() => { socket.emit('game:resign', { gameId: id, userId: user?.id }); }}
              className="btn-danger w-full text-sm py-2">
              Resign
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
