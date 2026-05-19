import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = Router();

// Search users by username
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) { res.json([]); return; }
    const users = await prisma.user.findMany({
      where: { username: { contains: q }, NOT: { id: req.userId } },
      select: { id: true, username: true, eloRating: true, city: true },
      take: 10,
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Send friend request
router.post('/request', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body;
    const requesterId = req.userId!;
    const receiver = await prisma.user.findUnique({ where: { username } });
    if (!receiver) { res.status(404).json({ error: 'User not found' }); return; }
    if (receiver.id === requesterId) { res.status(400).json({ error: 'Cannot add yourself' }); return; }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId: receiver.id },
          { requesterId: receiver.id, receiverId: requesterId },
        ],
      },
    });
    if (existing) {
      if (existing.status === 'accepted') { res.status(400).json({ error: 'Already friends' }); return; }
      if (existing.status === 'pending') { res.status(400).json({ error: 'Request already sent' }); return; }
      // declined — allow re-request
      await prisma.friendship.update({ where: { id: existing.id }, data: { status: 'pending', requesterId, receiverId: receiver.id } });
      res.json({ message: 'Request sent' }); return;
    }

    await prisma.friendship.create({ data: { requesterId, receiverId: receiver.id } });
    res.json({ message: 'Request sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Accept friend request
router.post('/accept/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship || friendship.receiverId !== req.userId) { res.status(404).json({ error: 'Not found' }); return; }
    await prisma.friendship.update({ where: { id }, data: { status: 'accepted' } });
    res.json({ message: 'Friend added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept' });
  }
});

// Decline friend request
router.post('/decline/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship || friendship.receiverId !== req.userId) { res.status(404).json({ error: 'Not found' }); return; }
    await prisma.friendship.update({ where: { id }, data: { status: 'declined' } });
    res.json({ message: 'Declined' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline' });
  }
});

// Remove friend
router.delete('/:friendId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const friendId = String(req.params.friendId);
    await prisma.friendship.deleteMany({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: userId, receiverId: friendId },
          { requesterId: friendId, receiverId: userId },
        ],
      },
    });
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove' });
  }
});

// List accepted friends
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      include: {
        requester: { select: { id: true, username: true, eloRating: true, city: true } },
        receiver: { select: { id: true, username: true, eloRating: true, city: true } },
      },
    });
    const friends = friendships.map((f: any) => ({
      friendshipId: f.id,
      friend: f.requesterId === userId ? f.receiver : f.requester,
    }));
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load friends' });
  }
});

// List pending incoming requests
router.get('/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.friendship.findMany({
      where: { receiverId: req.userId!, status: 'pending' },
      include: { requester: { select: { id: true, username: true, eloRating: true, city: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests.map((r: any) => ({ id: r.id, from: r.requester, createdAt: r.createdAt })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

export default router;
