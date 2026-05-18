import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Per-user rate limiter: 1 req/min, 20/day. In-memory.
interface RateState { recent: number[]; dayWindow: number[]; }
const rateMap = new Map<string, RateState>();
const MIN_GAP_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_LIMIT = 20;

function checkAiRate(userId: string): { ok: boolean; reason?: string } {
  const now = Date.now();
  let s = rateMap.get(userId);
  if (!s) { s = { recent: [], dayWindow: [] }; rateMap.set(userId, s); }
  s.recent = s.recent.filter(t => now - t < MIN_GAP_MS);
  s.dayWindow = s.dayWindow.filter(t => now - t < DAY_MS);
  if (s.recent.length > 0) return { ok: false, reason: 'One analysis per minute. Try again shortly.' };
  if (s.dayWindow.length >= DAILY_LIMIT) return { ok: false, reason: 'Daily AI Coach limit reached (20/day). Resets in 24 hours.' };
  s.recent.push(now);
  s.dayWindow.push(now);
  return { ok: true };
}

function buildPrompt(moveHistory: any[], result: string, playerColor: string, whitePieces: number, blackPieces: number): string {
  const totalMoves = moveHistory.length;
  const captureCount = moveHistory.reduce((sum: number, m: any) => sum + (m.captures?.length || 0), 0);
  const lastMoves = moveHistory.slice(-6).map((m: any, i: number) =>
    `Move ${totalMoves - Math.min(6, totalMoves) + i + 1}: (${m.from.row},${m.from.col})→(${m.to.row},${m.to.col})${m.captures?.length ? ` [captured ${m.captures.length}]` : ''}`
  ).join('\n');

  return `You are an expert coach for Kazakh / Russian checkers (шашки, "damka"). Rules to assume:
- 8x8 board, 12 men per side, dark squares only.
- Captures are MANDATORY — if a capture exists, the player must take it.
- Multi-jump capture chains are allowed and chosen by the player.
- A man promotes to a king when it reaches the far row.
- Kings move and capture along any number of diagonal squares (long-range).
- Standard win conditions: capture all opponent pieces or leave them with no legal move.

Game result: ${result} | Player being coached: ${playerColor}
Remaining pieces — White: ${whitePieces}, Black: ${blackPieces}
Total moves: ${totalMoves} | Total captures across both sides: ${captureCount}
Last moves (row,col coords):
${lastMoves}

Give 2-3 short sentences of honest, specific coaching:
- One concrete thing the player did well (cite a move if you can).
- One concrete improvement (king activity, center control, forced trades, back-rank defense).
- One tactical tip for next game tailored to Kazakh/Russian checkers (e.g. mandatory captures, king range).

Be direct and warm. No fluff, no generic "keep practicing". Reply in the same language the player likely uses (Russian or English).`;
}

// Fallback analysis when no API key is available
function staticFallback(result: string, playerColor: string, captureCount: number, totalMoves: number): string {
  const won = result.includes(playerColor === 'white' ? 'white' : 'black');
  if (won) {
    if (captureCount > totalMoves * 0.4) return `Excellent aggressive play — you captured ${captureCount} pieces and controlled the board. Keep this pressure style. Next game: focus on protecting your pieces after each capture.`;
    return `Well-played strategic game. You won in ${totalMoves} moves by outmaneuvering your opponent. Tip: practice forced capture sequences to finish games faster.`;
  }
  if (captureCount < 3) return `You lost without capturing many pieces — focus on mandatory capture rules and look for exchanges. Tip: always check if you can force your opponent into a bad position before moving.`;
  return `Tough loss in ${totalMoves} moves. You fought hard with ${captureCount} captures. Tip: in the endgame, move your pieces toward the center to maximize control. Keep practicing!`;
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('no key');
  // gemini-2.0-flash is Google AI Studio's current fast tier on v1beta
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callAnthropic(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('no key');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json() as any;
  return data.content?.[0]?.text ?? '';
}

async function callGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('no key');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}

router.post('/analyze', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const gate = checkAiRate(userId);
    if (!gate.ok) { res.status(429).json({ error: gate.reason }); return; }

    const { moveHistory, result, playerColor, whitePieces, blackPieces } = req.body;
    if (!moveHistory || !Array.isArray(moveHistory)) { res.status(400).json({ error: 'No move history' }); return; }

    const prompt = buildPrompt(moveHistory, result || 'unknown', playerColor || 'white', whitePieces || 0, blackPieces || 0);
    const captureCount = moveHistory.reduce((sum: number, m: any) => sum + (m.captures?.length || 0), 0);

    // Try AI providers in priority order, fall back to static analysis
    let analysis = '';
    const providers = [
      { name: 'Gemini', fn: () => callGemini(prompt) },
      { name: 'Anthropic', fn: () => callAnthropic(prompt) },
      { name: 'Groq', fn: () => callGroq(prompt) },
    ];

    for (const { name, fn } of providers) {
      try {
        analysis = await fn();
        if (analysis.trim()) {
          console.log(`[ai] used ${name}`);
          break;
        }
      } catch (err: any) {
        console.log(`[ai] ${name} unavailable: ${err.message}`);
      }
    }

    if (!analysis.trim()) {
      analysis = staticFallback(result || '', playerColor || 'white', captureCount, moveHistory.length);
    }

    res.json({ analysis });
  } catch (err) {
    console.error('[ai/analyze error]', err);
    res.status(500).json({ error: 'AI coach unavailable', analysis: 'Keep practicing your captures and king promotions. Every game is a learning opportunity!' });
  }
});

export default router;
