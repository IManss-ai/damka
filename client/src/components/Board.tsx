import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';

interface Piece { id: string; color: 'white' | 'black'; type: 'man' | 'king'; row: number; col: number; }
type BoardData = (Piece | null)[][];

interface BoardProps {
  board: BoardData;
  selectedPiece: { row: number; col: number } | null;
  legalMoves: { from: { row: number; col: number }; to: { row: number; col: number }; captures: any[] }[];
  onSquareClick: (row: number, col: number) => void;
  playerColor: 'white' | 'black';
  lastMove?: { from: { row: number; col: number }; to: { row: number; col: number } } | null;
}

const SQ = 62;

function PieceToken({ piece, selected, isKing }: { piece: Piece; selected: boolean; isKing: boolean }) {
  return (
    <div
      className={clsx(
        'w-full h-full rounded-full flex items-center justify-center relative overflow-hidden',
        piece.color === 'white'
          ? 'bg-gradient-to-br from-[#f8f0dc] via-[#e8d9b8] to-[#c8a870]'
          : 'bg-gradient-to-br from-[#4a4440] via-[#2c2826] to-[#181512]',
      )}
      style={{
        border: piece.color === 'white' ? '3px solid #b89050' : '3px solid #5e564e',
        boxShadow: selected
          ? '0 0 0 3px rgba(250,210,50,0.8), 0 4px 12px rgba(0,0,0,0.5)'
          : piece.color === 'white'
            ? 'inset 0 2px 6px rgba(255,255,255,0.5), 0 3px 8px rgba(0,0,0,0.4)'
            : 'inset 0 2px 4px rgba(255,255,255,0.07), 0 3px 8px rgba(0,0,0,0.5)',
      }}
    >
      {/* shine */}
      <div className="absolute rounded-full pointer-events-none" style={{
        top: '10%', left: '18%', width: '38%', height: '26%',
        background: piece.color === 'white' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.1)',
        filter: 'blur(2px)',
      }} />
      {/* ring */}
      <div className="absolute rounded-full pointer-events-none" style={{
        inset: '7px',
        border: piece.color === 'white' ? '1px solid rgba(160,120,60,0.3)' : '1px solid rgba(255,255,255,0.06)',
      }} />
      {isKing && (
        <span
          className={clsx('relative z-10 font-black', piece.color === 'white' ? 'text-amber-700' : 'text-amber-400')}
          style={{ fontSize: 18, textShadow: '0 1px 4px rgba(0,0,0,0.6)', fontFamily: 'serif' }}
        >
          ♛
        </span>
      )}
    </div>
  );
}

export default function Board({ board, selectedPiece, legalMoves, onSquareClick, playerColor, lastMove }: BoardProps) {
  const legalTargets = new Set(legalMoves.map(m => `${m.to.row},${m.to.col}`));
  const rows = playerColor === 'white' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const cols = playerColor === 'white' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];

  const [hovered, setHovered] = useState<string | null>(null);
  const [animating, setAnimating] = useState<Set<string>>(new Set());
  const prevBoard = useRef<BoardData>(board);

  // Collect all pieces for overlay rendering
  const allPieces: Piece[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r]?.[c];
      if (p) allPieces.push(p);
    }
  }

  const fileLabels = playerColor === 'white' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];
  const rankLabels = playerColor === 'white' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];

  // Detect moved pieces for animation trigger
  useEffect(() => {
    if (lastMove) {
      const movedPiece = board[lastMove.to.row]?.[lastMove.to.col];
      if (movedPiece) {
        setAnimating(prev => new Set([...prev, movedPiece.id]));
        setTimeout(() => setAnimating(prev => { const n = new Set(prev); n.delete(movedPiece.id); return n; }), 350);
      }
    }
    prevBoard.current = board;
  }, [board, lastMove]);

  const boardPx = SQ * 8;

  return (
    <div className="select-none" style={{ display: 'inline-block' }}>
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          width: boardPx,
          height: boardPx,
          boxShadow: '0 24px 60px rgba(0,0,0,0.65), 0 0 0 3px #0f0e0c, 0 0 0 6px #252220',
        }}
      >
        {/* Grid squares */}
        {rows.map((row, rowIdx) =>
          cols.map((col, colIdx) => {
            const isDark = (row + col) % 2 === 1;
            const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
            const isTarget = legalTargets.has(`${row},${col}`);
            const isLastFrom = lastMove?.from.row === row && lastMove?.from.col === col;
            const isLastTo = lastMove?.to.row === row && lastMove?.to.col === col;
            const isHov = hovered === `${row},${col}`;
            const hasPiece = !!board[row]?.[col];

            const sqBg = isDark
              ? (isLastFrom || isLastTo ? '#7aaa5a' : '#4e6e30')
              : (isLastFrom || isLastTo ? '#eae5c0' : '#c8c39e');

            return (
              <div
                key={`${row}-${col}`}
                onClick={() => onSquareClick(row, col)}
                onMouseEnter={() => setHovered(`${row},${col}`)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: colIdx * SQ,
                  top: rowIdx * SQ,
                  width: SQ,
                  height: SQ,
                  backgroundColor: sqBg,
                  cursor: 'pointer',
                }}
              >
                {/* Hover */}
                {isHov && !isSelected && <div className="absolute inset-0 bg-white/10" />}
                {/* Selection */}
                {isSelected && <div className="absolute inset-0 bg-yellow-300/25 ring-3 ring-inset ring-yellow-400/90 z-10" />}
                {/* Labels */}
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

        {/* Piece overlay — rendered ABOVE the grid, uses CSS transition for smooth movement */}
        {allPieces.map(piece => {
          const rowIdx = rows.indexOf(piece.row);
          const colIdx = cols.indexOf(piece.col);
          const isSelected = selectedPiece?.row === piece.row && selectedPiece?.col === piece.col;

          // Drop shadow
          const shadow = `0 4px 10px rgba(0,0,0,0.5)`;

          return (
            <div
              key={piece.id}
              onClick={() => onSquareClick(piece.row, piece.col)}
              style={{
                position: 'absolute',
                left: colIdx * SQ + SQ * 0.08,
                top: rowIdx * SQ + SQ * 0.08,
                width: SQ * 0.84,
                height: SQ * 0.84,
                transition: 'left 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.12s ease',
                transform: isSelected ? 'scale(1.1) translateY(-3px)' : 'scale(1)',
                zIndex: isSelected ? 30 : 20,
                cursor: 'pointer',
                filter: shadow,
              }}
            >
              <PieceToken piece={piece} selected={isSelected} isKing={piece.type === 'king'} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
