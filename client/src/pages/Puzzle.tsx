import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Board from '../components/Board';

export default function Puzzle() {
  const [puzzle, setPuzzle] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [legalMoves] = useState<any[]>([]);

  useEffect(() => {
    api.puzzles.daily()
      .then(p => { setPuzzle(p); api.puzzles.ranking(p.id).then(setRanking).catch(() => {}); })
      .catch(() => {});
  }, []);

  if (!puzzle) return <div className="text-center py-20 text-ink-muted text-sm">Loading today's puzzle...</div>;

  const parsed = typeof puzzle.boardState === 'string' ? JSON.parse(puzzle.boardState) : puzzle.boardState;
  const board = parsed.board ?? parsed;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-black text-ink mb-1">Daily Puzzle</h1>
      <p className="text-ink-muted text-sm mb-8">Find the winning move. Same puzzle for everyone today.</p>

      <div className="flex gap-8 items-start flex-wrap">
        <Board board={board} selectedPiece={selected} legalMoves={legalMoves}
          onSquareClick={(r,c) => setSelected({ row: r, col: c })} playerColor="white" />

        <div className="flex-1 min-w-[180px] space-y-4">
          <div className="card-sm">
            <p className="section-title">Today's Ranking</p>
            {ranking.length === 0
              ? <p className="text-ink-faint text-xs">No solvers yet — be first!</p>
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
            <p className="font-semibold text-ink mb-1">How to solve</p>
            <p>Click a piece, then click where to move. Find the forced win sequence for White.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
