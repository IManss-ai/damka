import { Router, Response } from 'express';
import prisma from '../prisma';
import { getRank } from '../services/elo';

const router = Router();

router.get('/:username', async (req, res: Response) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username }, include: { bossProgress: true, userCosmetics: { include: { cosmetic: true } } } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const games = await prisma.game.count({ where: { OR: [{ whitePlayerId: user.id }, { blackPlayerId: user.id }] } });
  res.json({ ...user, passwordHash: undefined, gamesPlayed: games, rank: getRank(user.eloRating) });
});

export default router;
