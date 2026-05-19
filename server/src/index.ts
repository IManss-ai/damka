// Keep the process alive on any unhandled error — log it, never crash.
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { setupSocket } from './socket';
import { runStartup } from './startup';
import authRoutes from './routes/auth';
import leaderboardRoutes from './routes/leaderboard';
import puzzleRoutes from './routes/puzzles';
import bossRoutes from './routes/bosses';
import userRoutes from './routes/users';
import cosmeticRoutes from './routes/cosmetics';
import aiRoutes from './routes/ai';

const app = express();
const httpServer = createServer(app);
const isProd = process.env.NODE_ENV === 'production';
const corsOrigin = isProd
  ? (process.env.CLIENT_URL || 'https://damka-a5p3.onrender.com')
  : 'http://localhost:5173';
const io = new Server(httpServer, { cors: { origin: corsOrigin, credentials: true } });

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/bosses', bossRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cosmetics', cosmeticRoutes);
app.use('/api/ai', aiRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Catch-all Express error handler — routes that call next(err) land here
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[route error]', err);
  if (!res.headersSent) res.status(500).json({ error: 'Server error' });
});

// Serve static client in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

setupSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, async () => {
  console.log(`Damka server running on port ${PORT}`);
  // Run seed after server is listening so clients don't time out waiting
  await runStartup();

  // Render free tier spins down after 15 min of inactivity. Render only counts
  // requests through its proxy as activity — localhost pings are invisible to it.
  // Ping the public external URL every 5 min so the server never spins down.
  if (process.env.NODE_ENV === 'production') {
    const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.CLIENT_URL?.replace(/\/$/, '');
    const keepaliveUrl = externalUrl ? `${externalUrl}/api/health` : `http://localhost:${PORT}/api/health`;
    setInterval(() => {
      fetch(keepaliveUrl).catch(err => console.warn('[keepalive] ping failed:', err?.message || err));
    }, 5 * 60 * 1000);
    console.log(`[keepalive] ping every 5 min -> ${keepaliveUrl}`);
  }
});
