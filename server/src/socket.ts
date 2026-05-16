import { Server, Socket } from 'socket.io';
import { GameState, Move } from './engine/types';
import { createGame, makeMove, isValidMove } from './engine/game';
import { getLegalMoves } from './engine/moves';
import { getBestMove } from './engine/ai';
import { generateMatchStory } from './engine/analysis';
import prisma from './prisma';
import { calculateElo } from './services/elo';
import { addCityPoints } from './services/city';
import { updateNemesis } from './services/nemesis';
import { v4 as uuidv4 } from 'uuid';

const BLITZ_MS = 3 * 60 * 1000; // 3 minutes per player

interface ActiveGame {
  id: string;
  state: GameState;
  whitePlayerId: string;
  blackPlayerId?: string;
  whiteUsername: string;
  blackUsername?: string;
  wagerAmount: number;
  gameMode: string;
  startTime: number;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  bossId?: number;
  spectators: number;
  // Blitz clock
  whiteTimeMs?: number;
  blackTimeMs?: number;
  turnStartTime?: number;
}

const activeGames = new Map<string, ActiveGame>();

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {

    // Create a new game room
    socket.on('game:create', async ({ userId, username, wagerAmount = 0, gameMode = 'casual', aiDifficulty, bossId }) => {
      const gameId = uuidv4();
      const isBlitz = gameMode === 'blitz';
      const game: ActiveGame = {
        id: gameId, state: createGame(),
        whitePlayerId: userId, whiteUsername: username,
        wagerAmount, gameMode, startTime: Date.now(),
        aiDifficulty, bossId, spectators: 0,
        whiteTimeMs: isBlitz ? BLITZ_MS : undefined,
        blackTimeMs: isBlitz ? BLITZ_MS : undefined,
        turnStartTime: isBlitz ? Date.now() : undefined,
      };
      activeGames.set(gameId, game);
      socket.join(`game:${gameId}`);
      socket.join('lobby');
      io.to('lobby').emit('lobby:gameCreated', { gameId, whiteUsername: username, gameMode, spectators: 0 });

      if (aiDifficulty || bossId) {
        // vs AI — start immediately
        socket.emit('game:started', { gameId, state: game.state, color: 'white', opponentName: bossId ? `Boss #${bossId}` : `AI (${aiDifficulty})` });
      } else {
        socket.emit('game:created', { gameId, shareLink: `/game/${gameId}` });
      }
    });

    // Join existing game as second player
    socket.on('game:join', async ({ gameId, userId, username }) => {
      const game = activeGames.get(gameId);
      if (!game || game.blackPlayerId) { socket.emit('game:error', { message: 'Game not available' }); return; }
      game.blackPlayerId = userId;
      game.blackUsername = username;
      socket.join(`game:${gameId}`);
      io.to(`game:${gameId}`).emit('game:started', { gameId, state: game.state, whiteUsername: game.whiteUsername, blackUsername: username });
      io.to('lobby').emit('lobby:gameUpdated', { gameId, status: 'active' });
    });

    // Spectate
    socket.on('game:spectate', ({ gameId }) => {
      const game = activeGames.get(gameId);
      if (!game) { socket.emit('game:error', { message: 'Game not found' }); return; }
      game.spectators++;
      socket.join(`game:${gameId}`);
      socket.emit('game:state', { state: game.state, whiteUsername: game.whiteUsername, blackUsername: game.blackUsername });
      io.to(`game:${gameId}`).emit('game:spectators', { count: game.spectators });
    });

    // Client requests current game state (called when Game.tsx mounts)
    socket.on('game:requestState', ({ gameId, userId }: { gameId: string; userId?: string }) => {
      const game = activeGames.get(gameId);
      if (!game) { socket.emit('game:notFound'); return; }
      socket.join(`game:${gameId}`);
      const playerColor = userId === game.whitePlayerId ? 'white' : userId === game.blackPlayerId ? 'black' : null;
      const isAI = !!(game.aiDifficulty || game.bossId);
      socket.emit('game:currentState', {
        state: game.state,
        whiteUsername: game.whiteUsername,
        blackUsername: game.blackUsername || (isAI ? (game.bossId ? `Boss #${game.bossId}` : `AI (${game.aiDifficulty})`) : undefined),
        playerColor: playerColor || (userId === game.whitePlayerId ? 'white' : 'black'),
        isSpectator: !playerColor,
        spectators: game.spectators,
        wagerAmount: game.wagerAmount,
        whiteTimeMs: game.whiteTimeMs,
        blackTimeMs: game.blackTimeMs,
      });
    });

    // Player makes a move
    socket.on('game:move', async ({ gameId, move, userId }: { gameId: string; move: Move; userId: string }) => {
      const game = activeGames.get(gameId);
      if (!game || game.state.result !== 'ongoing') return;
      const isWhite = game.whitePlayerId === userId && game.state.currentTurn === 'white';
      const isBlack = game.blackPlayerId === userId && game.state.currentTurn === 'black';
      if (!isWhite && !isBlack) return;
      if (!isValidMove(game.state, move)) { socket.emit('game:invalidMove'); return; }

      // Blitz clock: deduct elapsed time for the player who just moved
      if (game.whiteTimeMs !== undefined && game.blackTimeMs !== undefined && game.turnStartTime !== undefined) {
        const elapsed = Date.now() - game.turnStartTime;
        if (game.state.currentTurn === 'white') {
          game.whiteTimeMs = Math.max(0, game.whiteTimeMs - elapsed);
        } else {
          game.blackTimeMs = Math.max(0, game.blackTimeMs - elapsed);
        }
        // Timeout check
        if (game.whiteTimeMs <= 0) {
          game.state = { ...game.state, result: 'black_wins' };
        } else if (game.blackTimeMs <= 0) {
          game.state = { ...game.state, result: 'white_wins' };
        }
        game.turnStartTime = Date.now();
      }

      if (game.state.result !== 'ongoing') {
        io.to(`game:${gameId}`).emit('game:stateUpdate', { state: game.state, lastMove: move, whiteTimeMs: game.whiteTimeMs, blackTimeMs: game.blackTimeMs });
        await endGame(io, game);
        return;
      }

      game.state = makeMove(game.state, move);
      io.to(`game:${gameId}`).emit('game:stateUpdate', { state: game.state, lastMove: move, whiteTimeMs: game.whiteTimeMs, blackTimeMs: game.blackTimeMs });

      // AI response
      if (game.state.result === 'ongoing' && (game.aiDifficulty || game.bossId)) {
        setTimeout(async () => {
          const aiMove = getBestMove(game.state.board, 'black', game.aiDifficulty || 'medium', game.bossId);
          if (aiMove) {
            game.state = makeMove(game.state, aiMove);
            io.to(`game:${gameId}`).emit('game:stateUpdate', { state: game.state, lastMove: aiMove });
          }
          if (game.state.result !== 'ongoing') await endGame(io, game);
        }, 600);
        return;
      }

      if (game.state.result !== 'ongoing') await endGame(io, game);
    });

    // Get legal moves for a piece
    socket.on('game:legalMoves', ({ gameId, row, col }) => {
      const game = activeGames.get(gameId);
      if (!game) return;
      const all = getLegalMoves(game.state.board, game.state.currentTurn);
      const forPiece = all.filter(m => m.from.row === row && m.from.col === col);
      socket.emit('game:legalMovesResult', { moves: forPiece });
    });

    // Resign
    socket.on('game:resign', async ({ gameId, userId }: { gameId: string; userId: string }) => {
      const game = activeGames.get(gameId);
      if (!game || game.state.result !== 'ongoing') return;
      const isWhite = game.whitePlayerId === userId;
      const isBlack = game.blackPlayerId === userId;
      if (!isWhite && !isBlack) return;
      game.state.result = isWhite ? 'black_wins' : 'white_wins';
      await endGame(io, game);
    });

    // Lobby: get active games
    socket.on('lobby:join', () => {
      socket.join('lobby');
      const games = Array.from(activeGames.values())
        .filter(g => g.state.result === 'ongoing')
        .map(g => ({ id: g.id, whiteUsername: g.whiteUsername, blackUsername: g.blackUsername, gameMode: g.gameMode, spectators: g.spectators }));
      socket.emit('lobby:games', games);
    });

    socket.on('disconnect', () => {
      for (const [, game] of activeGames) {
        if (game.spectators > 0) game.spectators--;
      }
    });
  });
}

async function endGame(io: Server, game: ActiveGame) {
  const duration = Math.floor((Date.now() - game.startTime) / 1000);
  const winnerId = game.state.result === 'white_wins' ? game.whitePlayerId : game.state.result === 'black_wins' ? game.blackPlayerId : null;
  const loserId = winnerId === game.whitePlayerId ? game.blackPlayerId : game.whitePlayerId;

  const story = generateMatchStory(game.state, game.state.result === 'white_wins' ? 'white' : game.state.result === 'black_wins' ? 'black' : 'draw', game.whiteUsername, game.blackUsername || 'AI');

  // Save game to DB
  const dbGame = await prisma.game.create({ data: { id: game.id, whitePlayerId: game.whitePlayerId, blackPlayerId: game.blackPlayerId ?? null, moves: JSON.stringify(game.state.moveHistory), result: game.state.result, duration, wagerAmount: game.wagerAmount, gameMode: game.gameMode, aiDifficulty: game.aiDifficulty ?? null, bossId: game.bossId ?? null, matchStory: story } });

  // Update Elo and coins for PvP
  if (winnerId && loserId && game.blackPlayerId && !game.aiDifficulty && !game.bossId) {
    const [winner, loser] = await Promise.all([prisma.user.findUnique({ where: { id: winnerId } }), prisma.user.findUnique({ where: { id: loserId } })]);
    if (winner && loser) {
      const elo = calculateElo(winner.eloRating, loser.eloRating);
      await Promise.all([
        prisma.user.update({ where: { id: winnerId }, data: { eloRating: elo.winner, coins: { increment: 50 + game.wagerAmount } } }),
        prisma.user.update({ where: { id: loserId }, data: { eloRating: Math.max(800, elo.loser), coins: { decrement: game.wagerAmount } } }),
        addCityPoints(winner.city, 3),
        updateNemesis(winnerId, loserId),
      ]);
    }
  }

  // Boss beaten
  if (game.bossId && game.state.result === 'white_wins') {
    await prisma.bossProgress.upsert({ where: { userId_bossId: { userId: game.whitePlayerId, bossId: game.bossId } }, update: { beaten: true, beatenAt: new Date(), attempts: { increment: 1 } }, create: { userId: game.whitePlayerId, bossId: game.bossId, beaten: true, beatenAt: new Date(), attempts: 1 } });
    await prisma.user.update({ where: { id: game.whitePlayerId }, data: { bossesBeaten: { increment: 1 }, coins: { increment: 150 } } });
  }

  io.to(`game:${game.id}`).emit('game:ended', { result: game.state.result, story, gameId: game.id });
  io.to('lobby').emit('lobby:gameEnded', { gameId: game.id });
  activeGames.delete(game.id);
}
