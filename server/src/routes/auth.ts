import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { signToken } from '../middleware/auth';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password, city } = req.body;
  if (!username || !email || !password) { res.status(400).json({ error: 'Missing fields' }); return; }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, email, passwordHash, city: city || 'Almaty' } });
    const token = signToken(user.id);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: { id: user.id, username: user.username, city: user.city, eloRating: user.eloRating, coins: user.coins } });
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(400).json({ error: 'Username or email already taken' }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) { res.status(401).json({ error: 'Invalid credentials' }); return; }
  const token = signToken(user.id);
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ user: { id: user.id, username: user.username, city: user.city, eloRating: user.eloRating, coins: user.coins, isPro: user.isPro } });
});

router.post('/logout', (_req, res) => { res.clearCookie('token'); res.json({ ok: true }); });

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, username: true, city: true, eloRating: true, coins: true, isPro: true, bossesBeaten: true, streak: true, nemesisId: true } });
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ user });
});

export default router;
