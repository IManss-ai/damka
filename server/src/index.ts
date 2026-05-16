import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { setupSocket } from './socket';
import authRoutes from './routes/auth';
import leaderboardRoutes from './routes/leaderboard';
import puzzleRoutes from './routes/puzzles';
import bossRoutes from './routes/bosses';
import userRoutes from './routes/users';
import cosmeticRoutes from './routes/cosmetics';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true } });

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/bosses', bossRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cosmetics', cosmeticRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

setupSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`🎮 Damka server running on port ${PORT}`));
