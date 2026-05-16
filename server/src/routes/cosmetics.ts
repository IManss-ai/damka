import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => { res.json(await prisma.cosmetic.findMany()); });

router.get('/owned', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userCosmetics = await prisma.userCosmetic.findMany({ where: { userId: req.userId! }, select: { cosmeticId: true } });
  res.json(userCosmetics.map(uc => uc.cosmeticId));
});

router.post('/:id/buy', authMiddleware, async (req: AuthRequest, res: Response) => {
  const cosmetic = await prisma.cosmetic.findUnique({ where: { id: req.params.id as string } });
  if (!cosmetic) { res.status(404).json({ error: 'Not found' }); return; }
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.coins < cosmetic.price) { res.status(400).json({ error: 'Not enough coins' }); return; }
  await prisma.user.update({ where: { id: req.userId }, data: { coins: { decrement: cosmetic.price } } });
  await prisma.userCosmetic.create({ data: { userId: req.userId!, cosmeticId: cosmetic.id } });
  res.json({ ok: true });
});

export default router;
