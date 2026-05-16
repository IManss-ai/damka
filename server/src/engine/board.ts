import { Board, Color, Piece } from './types';

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  let id = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) {
          board[row][col] = { id: `b${id++}`, color: 'black', type: 'man', row, col };
        } else if (row > 4) {
          board[row][col] = { id: `w${id++}`, color: 'white', type: 'man', row, col };
        }
      }
    }
  }
  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

export function getPiece(board: Board, row: number, col: number): Piece | null {
  if (row < 0 || row > 7 || col < 0 || col > 7) return null;
  return board[row][col];
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row <= 7 && col >= 0 && col <= 7;
}

export function countPieces(board: Board): { white: number; black: number } {
  let white = 0, black = 0;
  for (const row of board) for (const cell of row) {
    if (cell?.color === 'white') white++;
    else if (cell?.color === 'black') black++;
  }
  return { white, black };
}
