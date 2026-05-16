import { GameState, Move, Color } from './types';
import { getLegalMoves } from './moves';
import { applyMove } from './moves';

export interface MissedCapture { moveIndex: number; from: { row: number; col: number }; betterMoves: Move[]; }

export function findMissedCaptures(states: GameState[], color: Color): MissedCapture[] {
  const missed: MissedCapture[] = [];
  for (let i = 0; i < states.length - 1; i++) {
    const state = states[i];
    if (state.currentTurn !== color) continue;
    const move = state.moveHistory[state.moveHistory.length - 1];
    if (!move || move.captures.length > 0) continue;
    const captures = getLegalMoves(state.board, color).filter(m => m.captures.length > 0);
    if (captures.length > 0) missed.push({ moveIndex: i, from: move.from, betterMoves: captures });
  }
  return missed;
}

export function generateMatchStory(state: GameState, winner: Color | 'draw', playerName: string, opponentName: string): string {
  const total = state.moveHistory.length;
  const captures = state.moveHistory.filter(m => m.captures.length > 0).length;
  const kingMoves = state.moveHistory.filter(m => m.isKingPromotion).length;
  if (winner === 'draw') return `${playerName} and ${opponentName} battled to a draw after ${total} moves. A tactical stalemate with ${captures} captures.`;
  const won = winner === 'white';
  if (total < 20) return `A lightning game — ${won ? playerName : opponentName} dominated from move one, finishing in just ${total} moves with ${captures} captures.`;
  if (captures > total * 0.5) return `A brutal ${total}-move war. ${won ? playerName : opponentName} won through relentless aggression — ${captures} pieces captured, ${kingMoves} kings promoted.`;
  return `A strategic ${total}-move contest. ${won ? playerName : opponentName} outmaneuvered the opponent, converting a positional advantage into victory. ${captures} captures, ${kingMoves} king promotions.`;
}
