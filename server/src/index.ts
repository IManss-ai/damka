import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { setupSocket } from './socket';
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

// Serve static client in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

setupSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`🎮 Damka server running on port ${PORT}`));
