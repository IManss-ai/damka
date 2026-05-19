import { Router, Response } from 'express';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => {
  try {
    res.json(await prisma.cosmetic.findMany());
  } catch (err) {
    console.error('[cosmetics/list]', err);
    res.status(500).json({ error: 'Could not load cosmetics' });
  }
});

router.get('/owned', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userCosmetics = await prisma.userCosmetic.findMany({ where: { userId: req.userId! }, select: { cosmeticId: true } });
    res.json(userCosmetics.map(uc => uc.cosmeticId));
  } catch (err) {
    console.error('[cosmetics/owned]', err);
    res.status(500).json({ error: 'Could not load owned items' });
  }
});

router.post('/:id/buy', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cosmetic = await prisma.cosmetic.findUnique({ where: { id: req.params.id as string } });
    if (!cosmetic) { res.status(404).json({ error: 'Not found' }); return; }

    // Already-owned guard — UserCosmetic has compound PK so a re-insert would
    // throw P2002 and surface as a generic 500.
    const owned = await prisma.userCosmetic.findUnique({
      where: { userId_cosmeticId: { userId: req.userId!, cosmeticId: cosmetic.id } },
    });
    if (owned) { res.status(400).json({ error: 'Already owned' }); return; }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) { res.status(401).json({ error: 'Session expired. Please log in again.' }); return; }
    if (user.coins < cosmetic.price) { res.status(400).json({ error: 'Not enough coins' }); return; }
    const updatedUser = await prisma.user.update({ where: { id: req.userId }, data: { coins: { decrement: cosmetic.price } } });
    await prisma.userCosmetic.create({ data: { userId: req.userId!, cosmeticId: cosmetic.id } });
    res.json({ ok: true, coins: updatedUser.coins });
  } catch (err) {
    console.error('[cosmetics/buy]', err);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

export default router;
