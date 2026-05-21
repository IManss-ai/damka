import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../lib/socket';
import { useAuth } from '../stores/auth';
import { sfx } from '../lib/sounds';
import { launchConfetti } from '../lib/confetti';
import Board from '../components/Board';
import { useSquareSize } from '../lib/useSquareSize';
import { useCosmetics } from '../stores/cosmetics';
import { toPng } from 'html-to-image';

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

  // Custom visual/interactive features states
  const [is3D, setIs3D] = useState(false);
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [reactions, setReactions] = useState<{ id: string; reaction: string; x: number }[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewStep, setReviewStep] = useState(0);
  const [reconstructedBoards, setReconstructedBoards] = useState<any[][][]>([]);
  const [reviewSuggestedMove, setReviewSuggestedMove] = useState<any | null>(null);
  const [suggestSuggestedLoading, setSuggestSuggestedLoading] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevPiecesRef = useRef<{ white: number; black: number } | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const suppressNextSoundRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const squareSize = useSquareSize();
  const socket = getSocket();
  const { equippedBoard, equippedPiece } = useCosmetics();

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

    socket.on('game:comment', ({ comment }) => {
      setActiveComment(comment);
    });

    socket.on('game:reaction', ({ reaction, id: rId }) => {
      setReactions(prev => [
        ...prev,
        { id: rId, reaction, x: 10 + Math.random() * 80 }
      ]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== rId));
      }, 2500);
    });

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
      socket.off('game:comment'); socket.off('game:reaction');
    };
  }, [id, user?.id, playerColor]);

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
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setAiAnalysis(data.error || 'Please wait about a minute between analyses.');
        return;
      }
      const data = await res.json();
      setAiAnalysis(data.analysis || 'AI coach is unavailable right now. Great game though!');
    } catch {
      setAiAnalysis('AI coach is unavailable right now. Great game though!');
    } finally {
      setAiLoading(false);
    }
  }

  // Auto-fire analysis once the result lands so the user doesn't have to click.
  useEffect(() => {
    if (result && !aiAnalysis && !aiLoading) {
      fetchAiAnalysis();
    }
  }, [result?.result]);

  function fmtTime(ms: number | null) {
    if (ms === null) return '';
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, '0')}`;
  }

  // Helper to reconstruct boards incrementally from initial to final moves
  function getReconstructedBoards(moveHistory: any[]): any[][][] {
    const initialBoard: any[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    let idCounter = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) {
            initialBoard[r][c] = { id: `b${idCounter++}`, color: 'black', type: 'man', row: r, col: c };
          } else if (r > 4) {
            initialBoard[r][c] = { id: `w${idCounter++}`, color: 'white', type: 'man', row: r, col: c };
          }
        }
      }
    }

    const list = [initialBoard];
    let cur = initialBoard;
    for (const m of moveHistory) {
      const nextBoard = cur.map(row => row.map(cell => cell ? { ...cell } : null));
      const piece = nextBoard[m.from.row]?.[m.from.col];
      if (piece) {
        nextBoard[m.from.row][m.from.col] = null;
        if (m.captures) {
          for (const cap of m.captures) {
            nextBoard[cap.row][cap.col] = null;
          }
        }
        const isKing = piece.type === 'king' ||
          (piece.color === 'white' && m.to.row === 0) ||
          (piece.color === 'black' && m.to.row === 7);
        nextBoard[m.to.row][m.to.col] = {
          ...piece,
          row: m.to.row,
          col: m.to.col,
          type: isKing ? 'king' : 'man'
        };
      }
      list.push(nextBoard);
      cur = nextBoard;
    }
    return list;
  }

  function countPiecesOnBoard(board: any[][], color: 'white' | 'black') {
    return board.flat().filter(p => p && p.color === color).length;
  }

  // Populate reconstructed boards when moveHistory exists
  useEffect(() => {
    if (state?.moveHistory) {
      const boards = getReconstructedBoards(state.moveHistory);
      setReconstructedBoards(boards);
      setReviewStep(boards.length - 1);
    }
  }, [state?.moveHistory]);

  // Handle keyboard navigation for Arrow keys
  useEffect(() => {
    if (!isReviewMode || reconstructedBoards.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setReviewStep(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setReviewStep(prev => Math.min(reconstructedBoards.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReviewMode, reconstructedBoards.length]);

  // Auto-clear best move highlight when step changes
  useEffect(() => {
    setReviewSuggestedMove(null);
  }, [reviewStep]);

  // Auto-clear commentary bubbles
  useEffect(() => {
    if (activeComment) {
      const timer = setTimeout(() => {
        setActiveComment(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeComment]);

  async function fetchSuggestedMove() {
    if (!activeBoard || suggestSuggestedLoading) return;
    setSuggestSuggestedLoading(true);
    setReviewSuggestedMove(null);
    const activeTurn = reviewStep % 2 === 0 ? 'white' : 'black';
    socket.emit('game:reviewSuggestMove', { board: activeBoard, turn: activeTurn }, (bestMove: any) => {
      setReviewSuggestedMove(bestMove);
      setSuggestSuggestedLoading(false);
    });
  }

  const downloadCard = () => {
    if (!cardRef.current) return;
    toPng(cardRef.current, { cacheBust: true, backgroundColor: '#1a1816' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `damka-match-wrap-${id}.png`;
        link.href = dataUrl;
        link.click();
        sfx.tick();
      })
      .catch((err) => {
        console.error('oops, something went wrong with card download!', err);
      });
  };

  const copyShareText = () => {
    const won = result?.result !== 'draw' && result?.result.includes('white') === (playerColor === 'white');
    const draw = result?.result === 'draw';
    const outcomeText = draw ? '🤝 Drew the match' : won ? '👑 Won the match' : '⚔️ Lost the match';
    const myEloDelta = result?.stats ? (playerColor === 'white' ? result.stats.whiteEloDelta : result.stats.blackEloDelta) : 0;
    const eloText = myEloDelta !== 0 ? `(${myEloDelta > 0 ? '+' : ''}${myEloDelta} ELO)` : '';
    const movesText = result?.stats ? `${result.stats.moves} moves` : '';
    const shareText = `Play Damka Checkers! ${outcomeText} ${eloText} in ${movesText}! Join the game at: ${window.location.origin}/game/${id}`;
    
    navigator.clipboard.writeText(shareText);
    sfx.tick();
    setShowToast('Share text copied!');
    setTimeout(() => setShowToast(null), 2000);
  };

  const sendReaction = (reaction: string) => {
    if (!id) return;
    socket.emit('game:sendReaction', { gameId: id, reaction });
  };

  const activeBoard = isReviewMode && reconstructedBoards[reviewStep] ? reconstructedBoards[reviewStep] : state?.board;
  const isMyTurn = state?.currentTurn === playerColor && !isSpectator;
  const myPieces = activeBoard ? countPiecesOnBoard(activeBoard, playerColor) : 0;
  const oppPieces = activeBoard ? countPiecesOnBoard(activeBoard, playerColor === 'white' ? 'black' : 'white') : 0;

  // Evaluation bar: score from -1 (black dominating) to +1 (white dominating)
  function evalScore(boardData: any[][] | undefined) {
    if (!boardData) return 0;
    const flat = boardData.flat();
    const wPieces = flat.filter(p => p?.color === 'white').length;
    const bPieces = flat.filter(p => p?.color === 'black').length;
    const wKings = flat.filter(p => p?.color === 'white' && p?.type === 'king').length;
    const bKings = flat.filter(p => p?.color === 'black' && p?.type === 'king').length;
    const wScore = wPieces + 0.5 * wKings;
    const bScore = bPieces + 0.5 * bKings;
    const total = wScore + bScore;
    return total === 0 ? 0 : (wScore - bScore) / total;
  }
  const evalVal = activeBoard ? evalScore(activeBoard) : 0; // -1..+1, positive = white ahead
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
  if (result && !isReviewMode) {
    const won  = result.result !== 'draw' && result.result.includes('white') === (playerColor === 'white');
    const draw = result.result === 'draw';
    const stats = result.stats;
    const myEloDelta = stats ? (playerColor === 'white' ? stats.whiteEloDelta : stats.blackEloDelta) : 0;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative">
        {/* Toast feedback */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-8 bg-accent text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl z-[100] text-sm"
            >
              {showToast}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-md">
          {/* Main result container with card and actions */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 25 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            {/* Spotify-Style Wrapped Card */}
            <div
              ref={cardRef}
              className={`p-6 rounded-2xl text-left relative overflow-hidden mb-6 ${
                draw
                  ? 'bg-gradient-to-br from-zinc-850 via-neutral-900 to-zinc-950 text-ink border border-zinc-800'
                  : won
                    ? 'bg-gradient-to-br from-[#1db954]/20 via-[#191414] to-[#0d6e2e]/30 text-ink border border-[#1db954]/30'
                    : 'bg-gradient-to-br from-rose-950 via-neutral-900 to-red-950/40 text-ink border border-red-900/30'
              }`}
              style={{ boxShadow: '0 24px 50px rgba(0,0,0,0.65)' }}
            >
              {/* Kazakhstan themed banner or decorative blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#1db954] font-black">Damka Wrapped 2026</span>
                  <h3 className="font-display text-2xl font-black tracking-tight mt-0.5">
                    {draw ? 'EVEN SPLIT' : won ? 'VICTORY SLAM' : 'HARD DEFEAT'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-ink-muted">DALA LEAGUE</span>
                </div>
              </div>

              {/* Big ELO Delta display */}
              <div className="my-6 flex items-baseline gap-2">
                <span className={`text-6xl font-black tracking-tighter ${won ? 'text-[#1db954]' : draw ? 'text-ink' : 'text-danger'}`}>
                  {myEloDelta >= 0 ? `+${myEloDelta}` : myEloDelta}
                </span>
                <span className="text-sm font-bold text-ink-muted uppercase">Rating Points</span>
              </div>

              {/* Stats blocks */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-border/40 mb-6">
                <div>
                  <span className="text-[10px] text-ink-faint uppercase font-bold block">Tactical Moves</span>
                  <span className="text-lg font-black text-ink">{stats?.moves ?? 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-faint uppercase font-bold block">Enemy Jumps</span>
                  <span className="text-lg font-black text-ink">{stats?.captures ?? 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-faint uppercase font-bold block">Combat Time</span>
                  <span className="text-lg font-black text-[#1db954]">{stats ? fmtDuration(stats.durationSec) : '0s'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-faint uppercase font-bold block">Your Side</span>
                  <span className="text-lg font-black text-ink capitalize">{playerColor} Army</span>
                </div>
              </div>

              {/* AI Coach Summary Quote */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#1db954]" />
                  <span className="text-[10px] font-black uppercase text-[#1db954] tracking-wider">AI Coach Verdict</span>
                </div>
                <p className="text-xs text-ink-muted italic leading-relaxed">
                  {aiAnalysis ? `"${aiAnalysis}"` : '"Calculating your strategic performance matrix..."'}
                </p>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="space-y-3 bg-surface-card border border-border rounded-2xl p-5 mb-4 shadow-xl">
              <div className="flex gap-2">
                <button
                  onClick={downloadCard}
                  className="btn-primary flex-1 text-xs py-3 flex items-center justify-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Card
                </button>
                <button
                  onClick={copyShareText}
                  className="btn-secondary flex-1 text-xs py-3 flex items-center justify-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share Match
                </button>
              </div>

              <button
                onClick={() => { setIsReviewMode(true); sfx.tick(); }}
                className="w-full btn-secondary text-xs py-3 flex items-center justify-center gap-1.5 border-accent/40 text-accent hover:bg-accent/15"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Review Game Step-by-Step
              </button>

              <div className="flex gap-2">
                <Link to="/play" className="btn-secondary flex-1 text-xs py-2.5">Play Again</Link>
                <Link to="/" className="btn-secondary flex-1 text-xs py-2.5">Home</Link>
              </div>
            </div>
          </motion.div>
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

  const boardPx = squareSize * 8;

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center lg:items-start justify-center">

        {/* Board column — width locked to board size so player bars match */}
        <div className="animate-board-entrance flex-shrink-0" style={{ width: boardPx }}>
          {/* Opponent bar */}
          <div className="flex items-center justify-between mb-2 bg-surface-card border border-border rounded-xl px-3 py-2 gap-2 relative">
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

            {/* Boss AI Commentary speech bubble */}
            <AnimatePresence>
              {activeComment && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="absolute top-full mt-2.5 left-4 bg-accent text-white text-xs px-3 py-2 rounded-xl shadow-xl z-40 font-medium max-w-[280px] border border-white/10"
                >
                  <div className="absolute -top-1.5 left-5 w-3 h-3 bg-accent rotate-45 border-l border-t border-white/10" />
                  💬 {activeComment}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Board Container */}
          <div className="relative" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {/* Spectator Emote float overlays */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-xl">
              {reactions.map(r => (
                <div
                  key={r.id}
                  className="floating-emote"
                  style={{ left: `${r.x}%` }}
                >
                  {r.reaction}
                </div>
              ))}
            </div>

            <Board
              board={activeBoard || []}
              selectedPiece={selected}
              legalMoves={legalMoves}
              onSquareClick={handleSquareClick}
              playerColor={playerColor}
              lastMove={isReviewMode ? (reviewStep > 0 ? state.moveHistory[reviewStep - 1] : null) : lastMove}
              squareSize={squareSize}
              boardClass={equippedBoard}
              pieceClass={equippedPiece}
              is3D={is3D}
              reviewSuggestedMove={reviewSuggestedMove}
            />
          </div>

          {/* My bar (directly below the board) */}
          <div className="flex items-center justify-between mt-2.5 bg-surface-card border border-border rounded-xl px-3 py-2 gap-2">
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

          {/* Controls Row (3D Toggle + Reactions + Resign) */}
          <div className="flex flex-wrap items-center justify-between mt-2.5 bg-surface-card border border-border rounded-xl px-4 py-2 gap-3">
            <div className="flex items-center gap-2">
              {/* 3D toggle button */}
              <button
                onClick={() => { setIs3D(!is3D); sfx.tick(); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  is3D
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-surface-raised border-border text-ink-muted hover:text-ink'
                }`}
              >
                3D: {is3D ? 'ON' : 'OFF'}
              </button>

              {!isSpectator && state.result === 'ongoing' && !isReviewMode && (
                <button
                  onClick={() => { setShowResignConfirm(true); sfx.tick(); }}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold border border-danger/30 text-danger hover:bg-danger/10 transition-all"
                >
                  Resign
                </button>
              )}
            </div>

            {/* Reactions tray */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-ink-faint mr-1">React:</span>
              {['👏', '🔥', '🤔', '😢', '👑'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { sendReaction(emoji); sfx.tick(); }}
                  className="text-lg hover:scale-125 transition-transform active:scale-95 px-1"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — side panel on LG, 2-col grid below board on mobile */}
        <div className="w-full lg:w-52 lg:space-y-3 lg:shrink-0 max-w-xl lg:max-w-none">
          {isReviewMode ? (
            <div className="bg-surface-card border border-border rounded-2xl p-4 space-y-4 shadow-xl text-left">
              <div>
                <h3 className="text-xs uppercase font-black tracking-wider text-accent mb-1">AI Coach Review</h3>
                <div className="text-sm font-bold text-ink mb-1">
                  Step {reviewStep} of {reconstructedBoards.length - 1}
                </div>
                <div className="text-[10px] text-ink-muted">
                  Use left/right arrows or buttons below
                </div>
              </div>

              {/* Review Navigation Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setReviewStep(prev => Math.max(0, prev - 1)); sfx.tick(); }}
                  disabled={reviewStep === 0}
                  className="btn-secondary flex-1 text-xs py-2 disabled:opacity-40"
                >
                  ◀ Prev
                </button>
                <button
                  onClick={() => { setReviewStep(prev => Math.min(reconstructedBoards.length - 1, prev + 1)); sfx.tick(); }}
                  disabled={reviewStep === reconstructedBoards.length - 1}
                  className="btn-secondary flex-1 text-xs py-2 disabled:opacity-40"
                >
                  Next ▶
                </button>
              </div>

              {/* Ask AI Coach for Best Move */}
              <button
                onClick={fetchSuggestedMove}
                disabled={suggestSuggestedLoading}
                className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-50"
              >
                {suggestSuggestedLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
                {reviewSuggestedMove ? 'Suggested Shown' : 'Ask AI Best Move'}
              </button>

              {/* Position evaluation info */}
              <div className="border-t border-border/40 pt-3">
                <span className="text-[10px] text-ink-faint uppercase font-bold block mb-1.5">Advantage Evaluation</span>
                <div className="flex gap-3 items-stretch">
                  <div className="flex flex-col w-4 rounded overflow-hidden border border-surface-border" style={{ height: 60 }}>
                    <div className="transition-all duration-300" style={{ height: `${100 - whiteBarPct}%`, background: '#2c2826' }} />
                    <div className="transition-all duration-300" style={{ height: `${whiteBarPct}%`, background: '#e8d9b8' }} />
                  </div>
                  <div className="flex flex-col justify-between text-xs py-0.5 font-mono">
                    <span className="text-[#2c2826] font-bold">● B</span>
                    <span className="text-ink-muted text-[10px]">
                      {evalVal > 0.05 ? `+${(evalVal * 100).toFixed(0)}` : evalVal < -0.05 ? `${(evalVal * 100).toFixed(0)}` : '='}
                    </span>
                    <span className="text-[#e8d9b8] font-bold">● W</span>
                  </div>
                </div>
              </div>

              {/* Exit Review */}
              <button
                onClick={() => { setIsReviewMode(false); sfx.tick(); }}
                className="w-full btn-primary text-xs py-2"
              >
                Exit Review
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:space-y-3 lg:gap-0">
              {spectators > 0 && (
                <div className="card-sm text-center text-xs text-ink-muted col-span-2 lg:col-span-1">
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
              <div className="card-sm col-span-2 lg:col-span-1">
                <p className="section-title">Move History</p>
                <div className="max-h-36 lg:max-h-52 overflow-y-auto space-y-0.5 scrollbar-thin">
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
            </div>
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
