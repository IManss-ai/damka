import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { launchCaptureExplosion } from '../lib/particles';

interface Piece { id: string; color: 'white' | 'black'; type: 'man' | 'king'; row: number; col: number; }
type BoardData = (Piece | null)[][];

interface BoardProps {
  board: BoardData;
  selectedPiece: { row: number; col: number } | null;
  legalMoves: { from: { row: number; col: number }; to: { row: number; col: number }; captures: any[] }[];
  onSquareClick: (row: number, col: number) => void;
  playerColor: 'white' | 'black';
  lastMove?: { from: { row: number; col: number }; to: { row: number; col: number } } | null;
  squareSize?: number;
  boardClass?: string;
  pieceClass?: string;
  is3D?: boolean;
  reviewSuggestedMove?: { from: { row: number; col: number }; to: { row: number; col: number } } | null;
}

// Color palettes for each piece theme
const PIECE_STYLES: Record<string, {
  whiteGrad: string; whiteBorder: string; whiteShine: string;
  blackGrad: string; blackBorder: string; blackShine: string;
}> = {
  'piece-classic': {
    whiteGrad: 'linear-gradient(135deg, #f8f0dc 0%, #e8d9b8 50%, #c8a870 100%)',
    whiteBorder: '#b89050', whiteShine: 'rgba(255,255,255,0.55)',
    blackGrad: 'linear-gradient(135deg, #4a4440 0%, #2c2826 50%, #181512 100%)',
    blackBorder: '#5e564e', blackShine: 'rgba(255,255,255,0.1)',
  },
  'piece-crystal': {
    whiteGrad: 'linear-gradient(135deg, #e8f8ff 0%, #a0d8f8 100%)',
    whiteBorder: '#80b8e8', whiteShine: 'rgba(255,255,255,0.75)',
    blackGrad: 'linear-gradient(135deg, #b8e0ff 0%, #5080c0 100%)',
    blackBorder: '#80a0d0', blackShine: 'rgba(200,240,255,0.35)',
  },
  'piece-gold': {
    whiteGrad: 'linear-gradient(135deg, #fff8cc 0%, #ffe880 100%)',
    whiteBorder: '#d4a017', whiteShine: 'rgba(255,255,180,0.7)',
    blackGrad: 'linear-gradient(135deg, #ffe080 0%, #b8860b 100%)',
    blackBorder: '#d4a017', blackShine: 'rgba(255,220,80,0.4)',
  },
  'piece-ruby': {
    whiteGrad: 'linear-gradient(135deg, #ffd0d0 0%, #ff8888 100%)',
    whiteBorder: '#cc4040', whiteShine: 'rgba(255,220,220,0.65)',
    blackGrad: 'linear-gradient(135deg, #ff6060 0%, #8b0000 100%)',
    blackBorder: '#cc2020', blackShine: 'rgba(255,100,100,0.25)',
  },
  'piece-obsidian': {
    whiteGrad: 'linear-gradient(135deg, #8a8a9a 0%, #5a5a6a 100%)',
    whiteBorder: '#9a9aaa', whiteShine: 'rgba(255,255,255,0.3)',
    blackGrad: 'linear-gradient(135deg, #3a3a4a 0%, #1a1a28 100%)',
    blackBorder: '#5a5a7a', blackShine: 'rgba(120,120,180,0.2)',
  },
  'piece-dombra': {
    whiteGrad: 'linear-gradient(135deg, #e3c498 0%, #c19e70 50%, #997548 100%)',
    whiteBorder: '#846137', whiteShine: 'rgba(255,255,255,0.45)',
    blackGrad: 'linear-gradient(135deg, #6c4e31 0%, #48311e 50%, #2b1b10 100%)',
    blackBorder: '#23150b', blackShine: 'rgba(255,255,255,0.15)',
  },
};

function PieceToken({ piece, selected, isKing, pieceClass, is3D }: {
  piece: Piece; selected: boolean; isKing: boolean; pieceClass?: string; is3D?: boolean;
}) {
  const theme = PIECE_STYLES[pieceClass || 'piece-classic'] ?? PIECE_STYLES['piece-classic'];
  const isWhite = piece.color === 'white';
  const grad = isWhite ? theme.whiteGrad : theme.blackGrad;
  const border = isWhite ? theme.whiteBorder : theme.blackBorder;
  const shine = isWhite ? theme.whiteShine : theme.blackShine;

  if (is3D) {
    return (
      <div 
        className="w-full h-full relative" 
        style={{ transformStyle: 'preserve-3d', transform: 'translateZ(10px)' }}
      >
        {/* Thickness layers */}
        <div
          className="absolute inset-0 rounded-full animate-board-piece-3d"
          style={{
            background: isWhite ? '#b89050' : '#141210',
            transform: 'translateZ(-2px)',
            border: `1px solid ${isWhite ? '#a07838' : '#050403'}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.6)'
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: isWhite ? '#c89e5c' : '#1e1a18',
            transform: 'translateZ(-4px)',
            border: `1px solid ${isWhite ? '#b08848' : '#0f0e0c'}`,
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: isWhite ? '#8e6b35' : '#090807',
            transform: 'translateZ(-6px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.8)'
          }}
        />

        {/* Top Face */}
        <div
          className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: grad,
            border: `3px solid ${border}`,
            transform: 'translateZ(0px)',
            boxShadow: selected
              ? 'inset 0 2px 6px rgba(255,255,255,0.5), 0 0 0 3px rgba(250,210,50,0.9), 0 6px 12px rgba(0,0,0,0.6)'
              : isWhite
                ? 'inset 0 2px 6px rgba(255,255,255,0.6), 0 3px 8px rgba(0,0,0,0.5)'
                : 'inset 0 2px 4px rgba(255,255,255,0.1), 0 3px 8px rgba(0,0,0,0.6)',
          }}
        >
          {/* shine */}
          <div className="absolute rounded-full pointer-events-none" style={{
            top: '10%', left: '18%', width: '38%', height: '26%',
            background: shine, filter: 'blur(2px)',
          }} />
          {/* ring */}
          <div className="absolute rounded-full pointer-events-none" style={{
            inset: '7px',
            border: isWhite ? '1px solid rgba(160,120,60,0.3)' : '1px solid rgba(255,255,255,0.06)',
          }} />
          {isKing && (
            <span
              className={clsx('relative z-10 font-black', isWhite ? 'text-amber-700' : 'text-amber-400')}
              style={{ fontSize: 18, textShadow: '0 1px 4px rgba(0,0,0,0.6)', fontFamily: 'serif' }}
            >
              ♛
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: grad,
        border: `3px solid ${border}`,
        boxShadow: selected
          ? '0 0 0 3px rgba(250,210,50,0.8), 0 4px 12px rgba(0,0,0,0.5)'
          : isWhite
            ? 'inset 0 2px 6px rgba(255,255,255,0.5), 0 3px 8px rgba(0,0,0,0.4)'
            : 'inset 0 2px 4px rgba(255,255,255,0.07), 0 3px 8px rgba(0,0,0,0.5)',
      }}
    >
      {/* shine */}
      <div className="absolute rounded-full pointer-events-none" style={{
        top: '10%', left: '18%', width: '38%', height: '26%',
        background: shine, filter: 'blur(2px)',
      }} />
      {/* ring */}
      <div className="absolute rounded-full pointer-events-none" style={{
        inset: '7px',
        border: isWhite ? '1px solid rgba(160,120,60,0.3)' : '1px solid rgba(255,255,255,0.06)',
      }} />
      {isKing && (
        <span
          className={clsx('relative z-10 font-black', isWhite ? 'text-amber-700' : 'text-amber-400')}
          style={{ fontSize: 18, textShadow: '0 1px 4px rgba(0,0,0,0.6)', fontFamily: 'serif' }}
        >
          ♛
        </span>
      )}
    </div>
  );
}

export default function Board({
  board, selectedPiece, legalMoves, onSquareClick, playerColor,
  lastMove, squareSize = 62, boardClass = 'board-classic', pieceClass = 'piece-classic',
  is3D = false, reviewSuggestedMove = null,
}: BoardProps) {
  const SQ = squareSize;
  const legalTargets = new Set(legalMoves.map(m => `${m.to.row},${m.to.col}`));
  const rows = playerColor === 'white' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const cols = playerColor === 'white' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];

  const [hovered, setHovered] = useState<string | null>(null);
  const [animating, setAnimating] = useState<Set<string>>(new Set());
  const [shouldShake, setShouldShake] = useState(false);
  
  const boardRef = useRef<HTMLDivElement>(null);
  const prevBoard = useRef<BoardData>(board);
  const prevPieceCountRef = useRef<number | null>(null);

  const allPieces: Piece[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r]?.[c];
      if (p) allPieces.push(p);
    }
  }

  const fileLabels = playerColor === 'white' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];
  const rankLabels = playerColor === 'white' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];

  // Handle move animations and capture effects
  useEffect(() => {
    if (lastMove) {
      const movedPiece = board[lastMove.to.row]?.[lastMove.to.col];
      if (movedPiece) {
        setAnimating(prev => new Set([...prev, movedPiece.id]));
        setTimeout(() => setAnimating(prev => { const n = new Set(prev); n.delete(movedPiece.id); return n; }), 350);
      }
    }

    // Capture detection & Screenshake & Particles triggering
    const currentPieceCount = allPieces.length;
    if (prevPieceCountRef.current !== null && currentPieceCount < prevPieceCountRef.current) {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 200);

      // Spawn capture particle explosion
      if (boardRef.current) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const prevPiece = prevBoard.current[r]?.[c];
            const curPiece = board[r]?.[c];
            // If a cell used to have a piece but is now empty
            if (prevPiece && !curPiece) {
              const wasMovedSource = lastMove?.from.row === r && lastMove?.from.col === c;
              const wasMovedDest = lastMove?.to.row === r && lastMove?.to.col === c;
              if (!wasMovedSource && !wasMovedDest) {
                launchCaptureExplosion(
                  boardRef.current,
                  r,
                  c,
                  playerColor,
                  prevPiece.color === 'white',
                  SQ
                );
              }
            }
          }
        }
      }
    }

    prevPieceCountRef.current = currentPieceCount;
    prevBoard.current = board;
  }, [board, lastMove]);

  const boardPx = SQ * 8;

  return (
    <div 
      className={clsx("select-none transition-all duration-500", is3D && "perspective-container")} 
      style={{ display: 'inline-block', touchAction: 'none', padding: is3D ? (window.innerWidth < 640 ? '12px 12px' : '24px 36px') : '0px' }}
    >
      <div
        ref={boardRef}
        className={clsx(
          `relative rounded-xl transition-all duration-500`,
          boardClass,
          is3D && "board-3d-active",
          shouldShake && "animate-shake"
        )}
        style={{
          width: boardPx,
          height: boardPx,
          boxShadow: is3D
            ? '0 35px 80px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.4), 0 0 0 3px #0f0e0c, 0 0 0 6px #252220'
            : '0 24px 60px rgba(0,0,0,0.65), 0 0 0 3px #0f0e0c, 0 0 0 6px #252220',
          transformStyle: is3D ? 'preserve-3d' : undefined,
        }}
      >
        {rows.map((row, rowIdx) =>
          cols.map((col, colIdx) => {
            const isDark = (row + col) % 2 === 1;
            const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
            const isTarget = legalTargets.has(`${row},${col}`);
            const isLastFrom = lastMove?.from.row === row && lastMove?.from.col === col;
            const isLastTo = lastMove?.to.row === row && lastMove?.to.col === col;
            const isHov = hovered === `${row},${col}`;
            const hasPiece = !!board[row]?.[col];

            // AI coach suggested best-move marking
            const isSuggestedFrom = reviewSuggestedMove?.from.row === row && reviewSuggestedMove?.from.col === col;
            const isSuggestedTo = reviewSuggestedMove?.to.row === row && reviewSuggestedMove?.to.col === col;

            return (
              <div
                key={`${row}-${col}`}
                onClick={() => onSquareClick(row, col)}
                onTouchEnd={(e) => { e.preventDefault(); onSquareClick(row, col); }}
                onMouseEnter={() => setHovered(`${row},${col}`)}
                onMouseLeave={() => setHovered(null)}
                className={isDark ? 'sq-dark' : 'sq-light'}
                style={{
                  position: 'absolute',
                  left: colIdx * SQ,
                  top: rowIdx * SQ,
                  width: SQ,
                  height: SQ,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  transform: is3D ? 'translateZ(0.5px)' : undefined,
                }}
              >
                {/* Last-move highlight */}
                {(isLastFrom || isLastTo) && <div className="absolute inset-0 bg-yellow-300/30 pointer-events-none" />}
                {/* Hover */}
                {isHov && !isSelected && <div className="absolute inset-0 bg-white/10" />}
                {/* Selection */}
                {isSelected && <div className="absolute inset-0 bg-yellow-300/25 ring-3 ring-inset ring-yellow-400/90 z-10" />}
                
                {/* Suggested Move Highlights */}
                {isSuggestedFrom && (
                  <div className="absolute inset-0 border-4 border-dashed border-emerald-400 bg-emerald-400/20 z-10 animate-pulse pointer-events-none" />
                )}
                {isSuggestedTo && (
                  <div className="absolute inset-0 border-4 border-emerald-400 bg-emerald-400/35 z-10 animate-pulse pointer-events-none" />
                )}

                {/* Rank/file labels */}
                {colIdx === 0 && (
                  <span className="absolute top-0.5 left-1 text-[9px] font-bold select-none pointer-events-none z-20"
                    style={{ color: isDark ? '#c8c39e' : '#4e6e30', opacity: 0.55 }}>
                    {rankLabels[rowIdx]}
                  </span>
                )}
                {row === (playerColor === 'white' ? 7 : 0) && (
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-bold select-none pointer-events-none z-20"
                    style={{ color: isDark ? '#c8c39e' : '#4e6e30', opacity: 0.55 }}>
                    {fileLabels[colIdx]}
                  </span>
                )}
                {/* Move dot */}
                {isDark && isTarget && !hasPiece && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-[18px] h-[18px] rounded-full bg-black/35 animate-pulse" />
                  </div>
                )}
                {isDark && isTarget && hasPiece && (
                  <div className="absolute inset-1.5 rounded-full border-[3px] border-yellow-300/80 pointer-events-none z-10" />
                )}
              </div>
            );
          })
        )}

        {/* Piece overlay */}
        {allPieces.map(piece => {
          const rowIdx = rows.indexOf(piece.row);
          const colIdx = cols.indexOf(piece.col);
          const isSelected = selectedPiece?.row === piece.row && selectedPiece?.col === piece.col;

          return (
            <div
              key={piece.id}
              onClick={() => onSquareClick(piece.row, piece.col)}
              onTouchEnd={(e) => { e.preventDefault(); onSquareClick(piece.row, piece.col); }}
              style={{
                position: 'absolute',
                left: colIdx * SQ + SQ * 0.08,
                top: rowIdx * SQ + SQ * 0.08,
                width: SQ * 0.84,
                height: SQ * 0.84,
                transition: 'left 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.12s ease',
                transform: isSelected 
                  ? 'scale(1.1) translateY(-3px)' 
                  : 'scale(1)',
                zIndex: isSelected ? 30 : 20,
                cursor: 'pointer',
                filter: is3D ? 'none' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
                touchAction: 'manipulation',
                transformStyle: is3D ? 'preserve-3d' : undefined,
              }}
            >
              <PieceToken piece={piece} selected={isSelected} isKing={piece.type === 'king'} pieceClass={pieceClass} is3D={is3D} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
