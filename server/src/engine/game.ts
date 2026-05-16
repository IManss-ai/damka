import { GameState, Move, Color, GameResult } from './types';
import { createInitialBoard, countPieces } from './board';
import { getLegalMoves, applyMove } from './moves';

export function createGame(): GameState {
  const board = createInitialBoard();
  return { board, currentTurn: 'white', result: 'ongoing', moveHistory: [], whitePieces: 12, blackPieces: 12, movesWithoutCapture: 0 };
}

export function makeMove(state: GameState, move: Move): GameState {
  const newBoard = applyMove(state.board, move);
  const { white, black } = countPieces(newBoard);
  const nextTurn: Color = state.currentTurn === 'white' ? 'black' : 'white';
  const movesWithoutCapture = move.captures.length > 0 ? 0 : state.movesWithoutCapture + 1;
  const nextMoves = getLegalMoves(newBoard, nextTurn);
  let result: GameResult = 'ongoing';
  if (white === 0) result = 'black_wins';
  else if (black === 0) result = 'white_wins';
  else if (nextMoves.length === 0) result = state.currentTurn === 'white' ? 'white_wins' : 'black_wins';
  else if (movesWithoutCapture >= 30) result = 'draw';
  return { board: newBoard, currentTurn: nextTurn, result, moveHistory: [...state.moveHistory, move], whitePieces: white, blackPieces: black, movesWithoutCapture };
}

export function isValidMove(state: GameState, move: Move): boolean {
  const legal = getLegalMoves(state.board, state.currentTurn);
  return legal.some(m => m.from.row === move.from.row && m.from.col === move.from.col && m.to.row === move.to.row && m.to.col === move.to.col);
}
