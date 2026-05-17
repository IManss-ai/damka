import { Router, Response } from 'express';
import prisma from '../prisma';
import { getRank } from '../services/elo';

const router = Router();

router.get('/:username', async (req, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username }, include: { bossProgress: true, userCosmetics: { include: { cosmetic: true } } } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const games = await prisma.game.count({ where: { OR: [{ whitePlayerId: user.id }, { blackPlayerId: user.id }], NOT: { result: 'pending' } } });
    const { passwordHash: _, ...safeUser } = user as any;
    res.json({ ...safeUser, gamesPlayed: games, rank: getRank(user.eloRating) });
  } catch (err) {
    console.error('[users/get]', err);
    res.status(500).json({ error: 'Could not load user' });
  }
});

export default router;
