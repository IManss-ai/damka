import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSocket } from '../lib/socket';
import { useAuth } from '../stores/auth';
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
    });

    socket.on('game:notFound', () => nav('/play'));
    socket.on('game:stateUpdate', ({ state: s, lastMove: lm }) => { setState(s); setLastMove(lm); setSelected(null); setLegalMoves([]); });
    socket.on('game:legalMovesResult', ({ moves }) => setLegalMoves(moves));
    socket.on('game:spectators', ({ count }) => setSpectators(count));
    socket.on('game:ended', (data) => setResult(data));

    return () => {
      socket.off('game:currentState'); socket.off('game:started'); socket.off('game:notFound');
      socket.off('game:stateUpdate'); socket.off('game:legalMovesResult');
      socket.off('game:spectators'); socket.off('game:ended');
    };
  }, [id, user?.id]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!state || !user || state.result !== 'ongoing' || isSpectator) return;
    if (state.currentTurn !== playerColor) return;
    const piece = state.board[row]?.[col];
    if (selected) {
      const target = legalMoves.find(m => m.to.row === row && m.to.col === col);
      if (target) { socket.emit('game:move', { gameId: id, move: target, userId: user.id }); setSelected(null); setLegalMoves([]); return; }
    }
    if (piece && piece.color === playerColor) {
      setSelected({ row, col });
      socket.emit('game:legalMoves', { gameId: id, row, col });
    } else { setSelected(null); setLegalMoves([]); }
  }, [state, selected, legalMoves, playerColor, user, id, isSpectator]);

  const isMyTurn = state?.currentTurn === playerColor && !isSpectator;
  const myPieces   = playerColor === 'white' ? state?.whitePieces : state?.blackPieces;
  const oppPieces  = playerColor === 'white' ? state?.blackPieces : state?.whitePieces;

  /* ---- Result screen ---- */
  if (result) {
    const won  = result.result !== 'draw' && result.result.includes('white') === (playerColor === 'white');
    const draw = result.result === 'draw';
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="card">
          <div className="text-5xl mb-4">{draw ? '=' : won ? '★' : '×'}</div>
          <h2 className={`text-2xl font-black mb-2 ${draw ? 'text-ink' : won ? 'text-accent' : 'text-danger'}`}>
            {draw ? "Draw" : won ? 'You Won!' : 'You Lost'}
          </h2>
          <p className="text-ink-muted italic mb-6 text-sm leading-relaxed">"{result.story}"</p>
          <div className="flex gap-3 justify-center">
            <Link to="/play" className="btn-primary">Play Again</Link>
            <Link to="/" className="btn-secondary">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Waiting screen ---- */
  if (waitingForOpponent) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="card">
        <div className="text-3xl mb-4 text-accent">⚔</div>
        <h2 className="text-lg font-black text-ink mb-2">Waiting for opponent</h2>
        <p className="text-ink-muted text-sm mb-4">Share this link with your friend:</p>
        <div className="bg-surface-nav border border-surface-border rounded-lg p-3 text-xs font-mono break-all mb-4 text-ink-muted">{shareLink}</div>
        <button onClick={() => navigator.clipboard.writeText(shareLink)} className="btn-primary">Copy Link</button>
      </div>
    </div>
  );

  /* ---- Loading screen ---- */
  if (!state) return (
    <div className="text-center py-20">
      <div className="text-ink-muted text-sm">Connecting to game...</div>
    </div>
  );

  /* ---- Game board ---- */
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex gap-6 items-start justify-center">

        {/* Board column */}
        <div>
          {/* Opponent bar */}
          <div className="flex items-center justify-between mb-2 bg-surface-card border border-surface-border rounded-lg px-4 py-2">
            <span className="font-semibold text-ink text-sm">{opponentName}</span>
            <span className="text-xs text-ink-muted">{oppPieces} pieces</span>
          </div>

          <Board board={state.board} selectedPiece={selected} legalMoves={legalMoves}
            onSquareClick={handleSquareClick} playerColor={playerColor} lastMove={lastMove} />

          {/* My bar */}
          <div className="flex items-center justify-between mt-2 bg-surface-card border border-surface-border rounded-lg px-4 py-2">
            <span className="font-semibold text-ink text-sm">{isSpectator ? 'Spectating' : (user?.username || 'You')}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-muted">{myPieces} pieces</span>
              {isMyTurn && state.result === 'ongoing' && (
                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded font-bold animate-pulse-glow">Your turn</span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-52 space-y-3 shrink-0">
          {spectators > 0 && (
            <div className="card-sm text-center text-xs text-ink-muted">{spectators} watching</div>
          )}
          <div className="card-sm">
            <p className="section-title">Move History</p>
            <div className="max-h-52 overflow-y-auto space-y-0.5">
              {state.moveHistory.slice(-12).map((m: any, i: number) => (
                <div key={i} className="text-xs text-ink-muted font-mono flex items-center gap-1">
                  <span className="text-ink-faint w-4 text-right">{state.moveHistory.length - (state.moveHistory.slice(-12).length) + i + 1}.</span>
                  <span>{m.from.row},{m.from.col}→{m.to.row},{m.to.col}</span>
                  {m.captures.length > 0 && <span className="text-danger">×{m.captures.length}</span>}
                </div>
              ))}
              {state.moveHistory.length === 0 && <div className="text-xs text-ink-faint">No moves yet</div>}
            </div>
          </div>
          {!isSpectator && state.result === 'ongoing' && (
            <button
              onClick={() => socket.emit('game:resign', { gameId: id, userId: user?.id })}
              className="btn-danger w-full text-sm py-2">
              Resign
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
