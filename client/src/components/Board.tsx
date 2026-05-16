import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
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

const SQ = 64;

export default function Board({ board, selectedPiece, legalMoves, onSquareClick, playerColor, lastMove }: BoardProps) {
  const legalTargets = new Set(legalMoves.map(m => `${m.to.row},${m.to.col}`));
  const rows = playerColor === 'white' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const [captureFlash, setCaptureFlash] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);

  const fileLabels = playerColor === 'white' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];
  const rankLabels = playerColor === 'white' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];

  useEffect(() => {
    if (!lastMove) return;
    const cap = legalMoves.find(m => m.to.row === lastMove.to.row && m.to.col === lastMove.to.col);
    if (cap && cap.captures.length > 0) {
      const keys = new Set<string>(cap.captures.map((c: any) => `${c.row},${c.col}`));
      setCaptureFlash(keys);
      const t = setTimeout(() => setCaptureFlash(new Set()), 450);
      return () => clearTimeout(t);
    }
  }, [lastMove]);

  return (
    <div className="select-none">
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.7), 0 0 0 3px #111, 0 0 0 6px #2e2b28' }}
      >
        {rows.map((row, rowIdx) => (
          <div key={row} className="flex">
            {[0,1,2,3,4,5,6,7].map(col => {
              const isDark = (row + col) % 2 === 1;
              const piece = board[row]?.[col];
              const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
              const isTarget = legalTargets.has(`${row},${col}`);
              const isLastFrom = lastMove?.from.row === row && lastMove?.from.col === col;
              const isLastTo = lastMove?.to.row === row && lastMove?.to.col === col;
              const isCapFlash = captureFlash.has(`${row},${col}`);
              const isHov = hovered === `${row},${col}`;

              const sqBg = isDark
                ? (isLastFrom || isLastTo ? '#8fb76a' : '#5a7a3a')
                : (isLastFrom || isLastTo ? '#f0ebc8' : '#d4cfa8');

              return (
                <div
                  key={col}
                  onClick={() => onSquareClick(row, col)}
                  onMouseEnter={() => setHovered(`${row},${col}`)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ width: SQ, height: SQ, backgroundColor: sqBg }}
                  className="relative flex items-center justify-center cursor-pointer"
                >
                  {/* Coordinate labels */}
                  {col === 0 && (
                    <span className="absolute top-0.5 left-1 text-[9px] font-bold select-none pointer-events-none z-10"
                      style={{ color: isDark ? '#d4cfa8' : '#5a7a3a', opacity: 0.5 }}>
                      {rankLabels[rowIdx]}
                    </span>
                  )}
                  {row === (playerColor === 'white' ? 7 : 0) && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-bold select-none pointer-events-none z-10"
                      style={{ color: isDark ? '#d4cfa8' : '#5a7a3a', opacity: 0.5 }}>
                      {fileLabels[col]}
                    </span>
                  )}

                  {/* Hover tint */}
                  {isHov && !isSelected && (
                    <div className="absolute inset-0 bg-white/10 pointer-events-none" />
                  )}

                  {/* Selection */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-yellow-400/20 ring-3 ring-inset ring-yellow-400/80 z-10 pointer-events-none" />
                  )}

                  {/* Capture flash */}
                  {isCapFlash && (
                    <motion.div
                      initial={{ opacity: 0.8, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.5 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 bg-red-500/60 z-20 pointer-events-none rounded-full mx-1 my-1"
                    />
                  )}

                  {/* Legal move dot */}
                  {isDark && isTarget && !piece && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-5 h-5 rounded-full bg-black/30" />
                    </div>
                  )}
                  {isDark && isTarget && piece && (
                    <div className="absolute inset-1.5 rounded-full border-[3px] border-yellow-300/80 pointer-events-none z-10" />
                  )}

                  {/* Piece */}
                  <AnimatePresence>
                    {piece && (
                      <motion.div
                        key={piece.id}
                        layoutId={piece.id}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: isSelected ? 1.12 : 1, opacity: 1, y: isSelected ? -3 : 0 }}
                        exit={{ scale: 0, opacity: 0, transition: { duration: 0.12 } }}
                        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                        className="relative z-20"
                        style={{ width: 50, height: 50 }}
                      >
                        {/* Shadow */}
                        <div className="absolute rounded-full" style={{
                          inset: '4px 4px -6px',
                          background: 'rgba(0,0,0,0.45)',
                          filter: 'blur(5px)',
                          transform: 'translateY(7px)',
                          zIndex: -1,
                        }} />

                        {/* Body */}
                        <div
                          className={clsx(
                            'w-full h-full rounded-full flex items-center justify-center relative overflow-hidden',
                            piece.color === 'white'
                              ? 'bg-gradient-to-br from-[#f8f0dc] via-[#e8d9b8] to-[#c8a870]'
                              : 'bg-gradient-to-br from-[#4a4440] via-[#2c2826] to-[#181512]',
                          )}
                          style={{
                            border: piece.color === 'white' ? '3px solid #b89050' : '3px solid #5e564e',
                            boxShadow: isSelected
                              ? '0 0 0 3px rgba(250,210,50,0.7), inset 0 2px 8px rgba(255,255,255,0.3)'
                              : piece.color === 'white'
                                ? 'inset 0 2px 8px rgba(255,255,255,0.45)'
                                : 'inset 0 2px 6px rgba(255,255,255,0.06)',
                          }}
                        >
                          {/* Shine */}
                          <div className="absolute rounded-full pointer-events-none" style={{
                            top: '8%', left: '18%', width: '42%', height: '30%',
                            background: piece.color === 'white'
                              ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)',
                            filter: 'blur(2px)',
                          }} />
                          {/* Ring */}
                          <div className="absolute rounded-full pointer-events-none" style={{
                            inset: '6px',
                            border: piece.color === 'white'
                              ? '1.5px solid rgba(160,120,60,0.35)'
                              : '1.5px solid rgba(255,255,255,0.07)',
                          }} />
                          {/* King */}
                          {piece.type === 'king' && (
                            <motion.span
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                              className={clsx('relative z-10', piece.color === 'white' ? 'text-amber-700' : 'text-amber-400')}
                              style={{ fontSize: 20, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
                            >
                              ♛
                            </motion.span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
