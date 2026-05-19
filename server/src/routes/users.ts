import { Router, Response } from 'express';
import prisma from '../prisma';
import { getRank } from '../services/elo';

const router = Router();

router.get('/:username', async (req, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      include: {
        bossProgress: true,
        userCosmetics: { include: { cosmetic: true } },
      },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const uid = user.id;

    const [wins, losses, draws, recentGames] = await Promise.all([
      prisma.game.count({
        where: {
          OR: [
            { whitePlayerId: uid, result: 'white' },
            { blackPlayerId: uid, result: 'black' },
          ],
        },
      }),
      prisma.game.count({
        where: {
          OR: [
            { whitePlayerId: uid, result: 'black' },
            { blackPlayerId: uid, result: 'white' },
          ],
        },
      }),
      prisma.game.count({
        where: {
          result: 'draw',
          OR: [{ whitePlayerId: uid }, { blackPlayerId: uid }],
        },
      }),
      prisma.game.findMany({
        where: {
          result: { notIn: ['ongoing', 'pending'] },
          OR: [{ whitePlayerId: uid }, { blackPlayerId: uid }],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          white: { select: { username: true } },
          black: { select: { username: true } },
        },
      }),
    ]);

    const gamesPlayed = wins + losses + draws;

    const recentGamesSummary = recentGames.map(g => {
      const isWhite = g.whitePlayerId === uid;
      const opponent = isWhite ? (g.black?.username ?? 'AI') : g.white.username;
      let outcome: 'win' | 'loss' | 'draw';
      if (g.result === 'draw') outcome = 'draw';
      else if ((g.result === 'white' && isWhite) || (g.result === 'black' && !isWhite)) outcome = 'win';
      else outcome = 'loss';
      return { id: g.id, opponent, outcome, gameMode: g.gameMode, eloChange: g.eloChange, createdAt: g.createdAt };
    });

    const { passwordHash: _, ...safeUser } = user as any;
    res.json({
      ...safeUser,
      gamesPlayed,
      wins,
      losses,
      draws,
      winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
      rank: getRank(user.eloRating),
      recentGames: recentGamesSummary,
    });
  } catch (err) {
    console.error('[users/get]', err);
    res.status(500).json({ error: 'Could not load user' });
  }
});

export default router;
