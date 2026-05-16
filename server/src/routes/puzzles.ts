import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/daily', async (_req, res: Response) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const puzzle = await prisma.dailyPuzzle.findFirst({ where: { date: today } });
  if (!puzzle) { res.status(404).json({ error: 'No puzzle today' }); return; }
  res.json(puzzle);
});

router.post('/:id/solve', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { movesUsed, timeSeconds } = req.body;
  const attempt = await prisma.puzzleAttempt.upsert({
    where: { userId_puzzleId: { userId: req.userId!, puzzleId: req.params.id as string } },
    update: { solved: true, movesUsed, timeSeconds, solvedAt: new Date() },
    create: { userId: req.userId!, puzzleId: req.params.id as string, solved: true, movesUsed, timeSeconds, solvedAt: new Date() },
  });
  await prisma.user.update({ where: { id: req.userId }, data: { streak: { increment: 1 }, coins: { increment: 25 } } });
  res.json(attempt);
});

router.get('/:id/ranking', async (req, res: Response) => {
  const attempts = await prisma.puzzleAttempt.findMany({ where: { puzzleId: req.params.id as string, solved: true }, orderBy: [{ movesUsed: 'asc' }, { timeSeconds: 'asc' }], take: 20, include: { user: { select: { username: true, city: true } } } });
  res.json(attempts.map((a, i) => ({ rank: i + 1, username: a.user.username, city: a.user.city, movesUsed: a.movesUsed, timeSeconds: a.timeSeconds })));
});

export default router;
