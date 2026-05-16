import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Public: list bosses with progress if authenticated
router.get('/', async (req: AuthRequest, res: Response) => {
  const bosses = await prisma.boss.findMany({ orderBy: { id: 'asc' } });
  const SECRET = process.env.JWT_SECRET || 'damka-secret-change-in-prod';
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  let userId: string | null = null;
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET) as { userId: string };
      userId = payload.userId;
    } catch {}
  }
  const progress = userId
    ? await prisma.bossProgress.findMany({ where: { userId } })
    : [];
  const progressMap = Object.fromEntries(progress.map(p => [p.bossId, p]));
  res.json(bosses.map(b => ({ ...b, progress: progressMap[b.id] || { beaten: false, attempts: 0 } })));
});

router.post('/:id/beaten', authMiddleware, async (req: AuthRequest, res: Response) => {
  const bossId = parseInt(req.params.id as string);
  await prisma.bossProgress.upsert({
    where: { userId_bossId: { userId: req.userId!, bossId } },
    update: { beaten: true, beatenAt: new Date(), attempts: { increment: 1 } },
    create: { userId: req.userId!, bossId, beaten: true, beatenAt: new Date(), attempts: 1 },
  });
  await prisma.user.update({ where: { id: req.userId }, data: { bossesBeaten: { increment: 1 }, coins: { increment: 150 } } });
  res.json({ ok: true });
});

router.post('/:id/attempt', authMiddleware, async (req: AuthRequest, res: Response) => {
  const bossId = parseInt(req.params.id as string);
  await prisma.bossProgress.upsert({
    where: { userId_bossId: { userId: req.userId!, bossId } },
    update: { attempts: { increment: 1 } },
    create: { userId: req.userId!, bossId, beaten: false, attempts: 1 },
  });
  res.json({ ok: true });
});

export default router;
