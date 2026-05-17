import { Router, Response } from 'express';
import prisma from '../prisma';
import { getWeekStart } from '../services/city';
import { getRank } from '../services/elo';

const router = Router();

router.get('/global', async (_req, res: Response) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { eloRating: 'desc' }, take: 50, select: { id: true, username: true, city: true, eloRating: true, isPro: true } });
    res.json(users.map((u, i) => ({ ...u, rank: i + 1, tier: getRank(u.eloRating) })));
  } catch (err) {
    console.error('[leaderboard/global]', err);
    res.status(500).json({ error: 'Could not load leaderboard' });
  }
});

router.get('/city', async (_req, res: Response) => {
  try {
    const weekStart = getWeekStart();
    const scores = await prisma.cityWeeklyScore.findMany({ where: { weekStart }, orderBy: { totalPoints: 'desc' } });
    res.json(scores.map((s, i) => ({ ...s, rank: i + 1 })));
  } catch (err) {
    console.error('[leaderboard/city]', err);
    res.status(500).json({ error: 'Could not load city scores' });
  }
});

export default router;
