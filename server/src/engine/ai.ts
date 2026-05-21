import { Board, Color, Move } from './types';
import { getLegalMoves, applyMove } from './moves';
import { countPieces } from './board';

function evaluate(board: Board, color: Color): number {
  let score = 0;
  for (const row of board) for (const cell of row) {
    if (!cell) continue;
    const val = cell.type === 'king' ? 3 : 1;
    const centerBonus = (Math.abs(cell.col - 3.5) < 2 && Math.abs(cell.row - 3.5) < 2) ? 0.1 : 0;
    score += cell.color === color ? (val + centerBonus) : -(val + centerBonus);
  }
  return score;
}

function minimax(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean, aiColor: Color): number {
  const humanColor: Color = aiColor === 'white' ? 'black' : 'white';
  const currentColor = maximizing ? aiColor : humanColor;
  const moves = getLegalMoves(board, currentColor);
  if (depth === 0 || moves.length === 0) return evaluate(board, aiColor);
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      best = Math.max(best, minimax(applyMove(board, move), depth - 1, alpha, beta, false, aiColor));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      best = Math.min(best, minimax(applyMove(board, move), depth - 1, alpha, beta, true, aiColor));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

const DEPTH_MAP = { easy: 2, medium: 4, hard: 5 };
const BOSS_DEPTHS: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 5 };

export function getBestMove(board: Board, color: Color, difficulty: 'easy' | 'medium' | 'hard' = 'medium', bossId?: number): Move | null {
  const moves = getLegalMoves(board, color);
  if (moves.length === 0) return null;
  if (difficulty === 'easy' && Math.random() < 0.4) return moves[Math.floor(Math.random() * moves.length)];
  const depth = bossId ? BOSS_DEPTHS[bossId] : DEPTH_MAP[difficulty];
  let bestMove = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    const score = minimax(applyMove(board, move), depth - 1, -Infinity, Infinity, false, color);
    if (score > bestScore) { bestScore = score; bestMove = move; }
  }
  return bestMove;
}
