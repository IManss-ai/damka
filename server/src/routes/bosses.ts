import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const bosses = await prisma.boss.findMany({ orderBy: { id: 'asc' } });
    const SECRET = process.env.JWT_SECRET || 'damka-secret-change-in-prod';
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    let userId: string | null = null;
    if (token) {
      try { const p = jwt.verify(token, SECRET) as { userId: string }; userId = p.userId; } catch {}
    }
    const progress = userId ? await prisma.bossProgress.findMany({ where: { userId } }) : [];
    const progressMap = Object.fromEntries(progress.map(p => [p.bossId, p]));
    res.json(bosses.map(b => ({ ...b, progress: progressMap[b.id] || { beaten: false, attempts: 0 } })));
  } catch (err) {
    console.error('[bosses/get]', err);
    res.status(500).json({ error: 'Could not load bosses' });
  }
});

router.post('/:id/beaten', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bossId = parseInt(req.params.id as string);
    await prisma.bossProgress.upsert({ where: { userId_bossId: { userId: req.userId!, bossId } }, update: { beaten: true, beatenAt: new Date(), attempts: { increment: 1 } }, create: { userId: req.userId!, bossId, beaten: true, beatenAt: new Date(), attempts: 1 } });
    await prisma.user.update({ where: { id: req.userId }, data: { bossesBeaten: { increment: 1 }, coins: { increment: 150 } } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[bosses/beaten]', err);
    res.status(500).json({ error: 'Could not update boss progress' });
  }
});

router.post('/:id/attempt', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bossId = parseInt(req.params.id as string);
    await prisma.bossProgress.upsert({ where: { userId_bossId: { userId: req.userId!, bossId } }, update: { attempts: { increment: 1 } }, create: { userId: req.userId!, bossId, beaten: false, attempts: 1 } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[bosses/attempt]', err);
    res.status(500).json({ error: 'Could not record attempt' });
  }
});

export default router;
