export type Color = 'white' | 'black';
export type PieceType = 'man' | 'king';

export interface Piece {
  id: string;
  color: Color;
  type: PieceType;
  row: number;
  col: number;
}

export interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  captures: { row: number; col: number }[];
  isKingPromotion?: boolean;
}

export type Board = (Piece | null)[][];

export type GameResult = 'white_wins' | 'black_wins' | 'draw' | 'ongoing';

export interface GameState {
  board: Board;
  currentTurn: Color;
  result: GameResult;
  moveHistory: Move[];
  whitePieces: number;
  blackPieces: number;
  movesWithoutCapture: number;
}
