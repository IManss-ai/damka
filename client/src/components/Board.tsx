import { motion, AnimatePresence } from 'framer-motion';
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

export default function Board({ board, selectedPiece, legalMoves, onSquareClick, playerColor, lastMove }: BoardProps) {
  const legalTargets = new Set(legalMoves.map(m => `${m.to.row},${m.to.col}`));
  const rows = playerColor === 'white' ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];

  return (
    <div className="inline-block border-2 border-[#1a1816] rounded-md overflow-hidden shadow-2xl">
      {rows.map(row => (
        <div key={row} className="flex">
          {[0,1,2,3,4,5,6,7].map(col => {
            const isDark = (row + col) % 2 === 1;
            const piece = board[row]?.[col];
            const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
            const isTarget = legalTargets.has(`${row},${col}`);
            const isLastFrom = lastMove?.from.row === row && lastMove?.from.col === col;
            const isLastTo = lastMove?.to.row === row && lastMove?.to.col === col;

            const sqColor = isDark
              ? (isLastFrom || isLastTo ? '#8fb76a' : '#739552')
              : (isLastFrom || isLastTo ? '#f5f0b0' : '#ebecd0');

            return (
              <div
                key={col}
                onClick={() => onSquareClick(row, col)}
                style={{ width: 60, height: 60, backgroundColor: sqColor }}
                className="relative flex items-center justify-center cursor-pointer select-none"
              >
                {/* Selection highlight */}
                {isSelected && (
                  <div className="absolute inset-0 ring-4 ring-inset ring-yellow-300 z-10 pointer-events-none" />
                )}

                {/* Legal move indicator */}
                {isDark && isTarget && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    {piece
                      ? <div className="absolute inset-1 rounded-full border-[3px] border-yellow-300 opacity-75" />
                      : <div className="w-5 h-5 rounded-full bg-black/25" />
                    }
                  </div>
                )}

                {/* Piece */}
                <AnimatePresence>
                  {piece && (
                    <motion.div
                      key={piece.id}
                      layoutId={piece.id}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: isSelected ? 1.1 : 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                      className={clsx(
                        'w-11 h-11 rounded-full flex items-center justify-center relative z-20 shadow-md',
                        piece.color === 'white'
                          ? 'bg-[#ede0c8] border-[3px] border-[#c8aa80]'
                          : 'bg-[#221e1a] border-[3px] border-[#5a5248]',
                      )}
                    >
                      <div className={clsx(
                        'absolute top-1 left-2.5 w-3 h-1.5 rounded-full opacity-25 bg-white'
                      )} />
                      {piece.type === 'king' && (
                        <span className={clsx(
                          'text-sm font-black',
                          piece.color === 'white' ? 'text-amber-700' : 'text-amber-400'
                        )}>♔</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
