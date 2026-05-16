import { Board, Color, Move, Piece } from './types';
import { cloneBoard, getPiece, inBounds } from './board';

function getCaptureMoves(board: Board, piece: Piece, visited: Set<string> = new Set()): Move[] {
  const captures: Move[] = [];
  const dirs = piece.type === 'king'
    ? [[-1,-1],[-1,1],[1,-1],[1,1]]
    : piece.color === 'white' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];

  if (piece.type === 'king') {
    for (const [dr, dc] of dirs) {
      let r = piece.row + dr, c = piece.col + dc;
      let enemy: Piece | null = null;
      while (inBounds(r, c)) {
        const cell = getPiece(board, r, c);
        if (cell) {
          if (cell.color === piece.color || enemy) break;
          enemy = cell;
        } else if (enemy) {
          const key = `${piece.row},${piece.col}->${r},${c}`;
          if (!visited.has(key)) {
            const newBoard = cloneBoard(board);
            newBoard[piece.row][piece.col] = null;
            newBoard[enemy.row][enemy.col] = null;
            const movedPiece = { ...piece, row: r, col: c };
            newBoard[r][c] = movedPiece;
            visited.add(key);
            const further = getCaptureMoves(newBoard, movedPiece, new Set(visited));
            if (further.length === 0) {
              captures.push({ from: { row: piece.row, col: piece.col }, to: { row: r, col: c }, captures: [{ row: enemy.row, col: enemy.col }] });
            } else {
              for (const f of further) captures.push({ from: { row: piece.row, col: piece.col }, to: f.to, captures: [{ row: enemy.row, col: enemy.col }, ...f.captures] });
            }
          }
        }
        r += dr; c += dc;
      }
    }
  } else {
    const allDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, dc] of allDirs) {
      const mr = piece.row + dr, mc = piece.col + dc;
      const lr = piece.row + 2*dr, lc = piece.col + 2*dc;
      const mid = getPiece(board, mr, mc);
      if (mid && mid.color !== piece.color && inBounds(lr, lc) && !getPiece(board, lr, lc)) {
        const key = `${piece.row},${piece.col}->${lr},${lc}`;
        if (!visited.has(key)) {
          const newBoard = cloneBoard(board);
          newBoard[piece.row][piece.col] = null;
          newBoard[mr][mc] = null;
          const movedPiece = { ...piece, row: lr, col: lc };
          newBoard[lr][lc] = movedPiece;
          visited.add(key);
          const further = getCaptureMoves(newBoard, movedPiece, new Set(visited));
          if (further.length === 0) {
            captures.push({ from: { row: piece.row, col: piece.col }, to: { row: lr, col: lc }, captures: [{ row: mr, col: mc }] });
          } else {
            for (const f of further) captures.push({ from: { row: piece.row, col: piece.col }, to: f.to, captures: [{ row: mr, col: mc }, ...f.captures] });
          }
        }
      }
    }
  }
  return captures;
}

function getSimpleMoves(board: Board, piece: Piece): Move[] {
  const moves: Move[] = [];
  if (piece.type === 'king') {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      let r = piece.row + dr, c = piece.col + dc;
      while (inBounds(r, c) && !getPiece(board, r, c)) {
        moves.push({ from: { row: piece.row, col: piece.col }, to: { row: r, col: c }, captures: [] });
        r += dr; c += dc;
      }
    }
  } else {
    const dirs = piece.color === 'white' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
    for (const [dr, dc] of dirs) {
      const r = piece.row + dr, c = piece.col + dc;
      if (inBounds(r, c) && !getPiece(board, r, c)) {
        moves.push({ from: { row: piece.row, col: piece.col }, to: { row: r, col: c }, captures: [] });
      }
    }
  }
  return moves;
}

export function getLegalMoves(board: Board, color: Color): Move[] {
  const pieces: Piece[] = [];
  for (const row of board) for (const cell of row) {
    if (cell?.color === color) pieces.push(cell);
  }
  const allCaptures = pieces.flatMap(p => getCaptureMoves(board, p));
  if (allCaptures.length > 0) return allCaptures;
  return pieces.flatMap(p => getSimpleMoves(board, p));
}

export function applyMove(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from.row][move.from.col]!;
  for (const cap of move.captures) newBoard[cap.row][cap.col] = null;
  newBoard[move.from.row][move.from.col] = null;
  const isKing = piece.type === 'king' ||
    (piece.color === 'white' && move.to.row === 0) ||
    (piece.color === 'black' && move.to.row === 7);
  newBoard[move.to.row][move.to.col] = { ...piece, row: move.to.row, col: move.to.col, type: isKing ? 'king' : 'man' };
  return newBoard;
}
