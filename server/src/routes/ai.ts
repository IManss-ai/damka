import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/analyze', async (req, res) => {
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
