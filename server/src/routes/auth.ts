import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import prisma from '../prisma';
import { signToken } from '../middleware/auth';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  const { username, email, password, city } = req.body;
  if (!username || !email || !password) { res.status(400).json({ error: 'Missing fields' }); return; }
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    res.status(400).json({ error: 'Username must be 3-20 letters, digits, or underscores' }); return;
  }
  if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Invalid email address' }); return;
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    res.status(400).json({ error: 'Password must be 6-128 characters' }); return;
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, email: email.toLowerCase(), passwordHash, city: city || 'Almaty' } });
    const token = signToken(user.id);
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ user: { id: user.id, username: user.username, city: user.city, eloRating: user.eloRating, coins: user.coins, isPro: user.isPro, bossesBeaten: user.bossesBeaten, streak: user.streak } });
  } catch (e: any) {
    if (e.code === 'P2002') { res.status(400).json({ error: 'Username or email already taken' }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Missing credentials' }); return;
  }
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) { res.status(401).json({ error: 'Invalid credentials' }); return; }
  const token = signToken(user.id);
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ user: { id: user.id, username: user.username, city: user.city, eloRating: user.eloRating, coins: user.coins, isPro: user.isPro } });
});

router.post('/logout', (_req, res) => { res.clearCookie('token', COOKIE_OPTS); res.json({ ok: true }); });

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, username: true, city: true, eloRating: true, coins: true, isPro: true, bossesBeaten: true, streak: true, nemesisId: true } });
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ user });
});

export default router;
