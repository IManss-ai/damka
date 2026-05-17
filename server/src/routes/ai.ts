import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Per-user rate limiter: 1 request/min, 10/day. In-memory.
interface RateState { recent: number[]; dayWindow: number[]; }
const rateMap = new Map<string, RateState>();
const MIN_GAP_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_LIMIT = 10;

function checkAiRate(userId: string): { ok: boolean; reason?: string; retryAfterMs?: number } {
  const now = Date.now();
  let s = rateMap.get(userId);
  if (!s) { s = { recent: [], dayWindow: [] }; rateMap.set(userId, s); }
  s.recent = s.recent.filter(t => now - t < MIN_GAP_MS);
  s.dayWindow = s.dayWindow.filter(t => now - t < DAY_MS);
  if (s.recent.length > 0) {
    const wait = MIN_GAP_MS - (now - s.recent[s.recent.length - 1]);
    return { ok: false, reason: 'Slow down — one analysis per minute.', retryAfterMs: wait };
  }
  if (s.dayWindow.length >= DAILY_LIMIT) {
    return { ok: false, reason: 'Daily AI Coach limit reached. Resets in 24 hours.' };
  }
  s.recent.push(now);
  s.dayWindow.push(now);
  return { ok: true };
}

router.post('/analyze', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const gate = checkAiRate(userId);
  if (!gate.ok) {
    if (gate.retryAfterMs) res.set('Retry-After', String(Math.ceil(gate.retryAfterMs / 1000)));
    res.status(429).json({ error: gate.reason });
    return;
  }

  const { moveHistory, result, playerColor, whitePieces, blackPieces } = req.body;

  if (!moveHistory) {
    return res.status(400).json({ error: 'No move history provided' });
  }

  const totalMoves = moveHistory.length;
  const captures = moveHistory.filter((m: any) => m.captures?.length > 0);
  const captureCount = captures.reduce((sum: number, m: any) => sum + m.captures.length, 0);

  const gameDesc = moveHistory.slice(-8).map((m: any, i: number) =>
    `Move ${totalMoves - Math.min(8, totalMoves) + i + 1}: ${m.from.row},${m.from.col} → ${m.to.row},${m.to.col}${m.captures?.length ? ` (captured ${m.captures.length})` : ''}`
  ).join('\n');

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 280,
      messages: [{
        role: 'user',
        content: `You are an expert checkers coach. Analyze this game briefly.

Game result: ${result || 'ongoing'}
Player color: ${playerColor}
Final piece count — White: ${whitePieces}, Black: ${blackPieces}
Total moves: ${totalMoves}
Total captures: ${captureCount}
Last moves:
${gameDesc}

Give 2-3 sentences of honest, specific coaching feedback. Focus on:
- One thing the player did well
- One specific improvement to make
- A tactical tip for their next game

Be direct, concrete, and encouraging. No fluff.`,
      }],
    });

    const analysis = (message.content[0] as any).text;
    res.json({ analysis });
  } catch (err: any) {
    console.error('AI analyze error:', err.message);
    res.status(500).json({ error: 'AI coach unavailable', analysis: 'Great effort! Keep practicing your forced captures and king promotions.' });
  }
});

export default router;
