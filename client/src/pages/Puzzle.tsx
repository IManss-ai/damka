import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Board from '../components/Board';
import { useT } from '../lib/i18n';
import { useSquareSize } from '../lib/useSquareSize';
import { useCosmetics } from '../stores/cosmetics';

export default function Puzzle() {
  const squareSize = useSquareSize(62, 32);
  const { equippedBoard, equippedPiece } = useCosmetics();
  const [puzzle, setPuzzle] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [puzzleBoard, setPuzzleBoard] = useState<any[][]>([]);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<any[]>([]);
  const [solved, setSolved] = useState(false);
  const [solveMsg, setSolveMsg] = useState('');
  const [lastMove, setLastMove] = useState<any>(null);
  const t = useT();

  useEffect(() => {
    api.puzzles.daily()
      .then(p => {
        setPuzzle(p);
        const parsed = typeof p.boardState === 'string' ? JSON.parse(p.boardState) : p.boardState;
        setPuzzleBoard(parsed.board ?? parsed);
        api.puzzles.ranking(p.id).then(setRanking).catch(() => {});
      })
      .catch(() => {});
  }, []);

  function handleSquareClick(r: number, c: number) {
    if (!puzzle || solved) return;
    const solution: any[] = typeof puzzle.solution === 'string' ? JSON.parse(puzzle.solution) : puzzle.solution;

    if (selected) {
      const targetMove = legalMoves.find(m => m.to.row === r && m.to.col === c);
      if (targetMove) {
        const newBoard = puzzleBoard.map(row => row.map((p: any) => (p ? { ...p } : null)));
        const piece = newBoard[targetMove.from.row]?.[targetMove.from.col];
        if (piece) {
          newBoard[targetMove.from.row][targetMove.from.col] = null;
          piece.row = targetMove.to.row;
          piece.col = targetMove.to.col;
          newBoard[targetMove.to.row][targetMove.to.col] = piece;
          for (const cap of (targetMove.captures || [])) {
            newBoard[cap.row][cap.col] = null;
          }
        }
        setPuzzleBoard(newBoard);
        setLastMove({ from: targetMove.from, to: targetMove.to });
        setSelected(null);
        setLegalMoves([]);
        setSolved(true);
        setSolveMsg('Correct! Puzzle solved!');
        api.puzzles.solve(puzzle.id, { moves: 1, timeSeconds: 0 }).catch(() => {});
        return;
      }
    }

    const piece = puzzleBoard[r]?.[c];
    if (piece && piece.color === 'white') {
      const moves = solution.filter((m: any) => m.from.row === r && m.from.col === c);
      if (moves.length > 0) {
        setSelected({ row: r, col: c });
        setLegalMoves(moves);
        return;
      }
    }

    setSelected(null);
    setLegalMoves([]);
  }

  if (!puzzle) return <div className="text-center py-20 text-ink-muted text-sm">{t('puzzle.loading')}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-black text-ink mb-1">{t('puzzle.title')}</h1>
      <p className="text-ink-muted text-sm mb-8">{t('puzzle.subtitle')}</p>

      {solveMsg && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-accent text-sm mb-4 font-semibold">
          {solveMsg}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        <div className="mx-auto md:mx-0">
        <Board board={puzzleBoard} selectedPiece={selected} legalMoves={legalMoves}
          onSquareClick={handleSquareClick} playerColor="white" lastMove={lastMove}
          squareSize={squareSize} boardClass={equippedBoard} pieceClass={equippedPiece} />
        </div>

        <div className="flex-1 min-w-[180px] space-y-4">
          <div className="card-sm">
            <p className="section-title">{t('puzzle.ranking')}</p>
            {ranking.length === 0
              ? <p className="text-ink-faint text-xs">{t('puzzle.noSolvers')}</p>
              : ranking.map(r => (
                <div key={r.rank} className="flex items-center gap-2 py-1.5 border-b border-surface-border text-xs last:border-0">
                  <span className="font-black text-accent w-5">#{r.rank}</span>
                  <span className="flex-1 font-medium text-ink">{r.username}</span>
                  <span className="text-ink-muted">{r.movesUsed}m</span>
                  <span className="text-ink-faint">{r.timeSeconds}s</span>
                </div>
              ))
            }
          </div>
          <div className="card-sm text-xs text-ink-muted">
            <p className="font-semibold text-ink mb-1">{t('puzzle.howToSolve')}</p>
            <p>{t('puzzle.howToSolveDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
