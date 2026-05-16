# Damka

Competitive Russian checkers platform. Real-time multiplayer, ELO rankings, AI coaching, city rivalries.

**Live:** https://damka-a5p3.onrender.com
**GitHub:** https://github.com/IManss-ai/damka

---

## What it is

Russian shashki (shashki) is the most played board game in Central Asia. There is no serious online platform for it. Damka is that platform.

This is not a checkers board. It is a competitive system built around the game — the same way chess.com is built around chess. The core thesis: if you give players ELO ratings, city rivalries, daily puzzles, a boss campaign, and coaching after every loss, they come back. The game is the content; the platform creates the reason to stay.

## Features

| Feature | What it does |
|---|---|
| Live Multiplayer | Share a link. Opponent joins in under 3 seconds. No account required on their end. |
| ELO System | Every ranked game moves your rating. Win against stronger players, earn more. |
| City Rivalry | Wins count toward your city's weekly score. Almaty vs Astana. Real stakes. |
| Blitz Mode | 3-minute clock per player. Run out of time, you lose. Fastest checkers on the internet. |
| Boss Rush | 5 progressively harder AI opponents. Each one unlocks a cosmetic on defeat. |
| AI Coach | After every game, Claude analyzes your moves and explains what you missed. |
| Daily Puzzle | One tactical position per day, same for everyone. Global speed ranking. |
| Evaluation Bar | Position advantage meter during games. Shows who is ahead and by how much. |
| Shop | Board themes and piece sets, bought with in-game coins. Pro tier available. |

## Why it works as a business

The monetization follows the chess.com playbook applied to a different game:

- Coins from wins, spent in the shop: retention loop
- Cosmetics with rarity tiers: social status signals
- Pro membership at $4.99/month: unlimited AI coaching, exclusive boards, Pro badge
- City rivalry creates local network effects that global platforms cannot replicate

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, Socket.IO, Prisma, SQLite
- **AI:** Anthropic Claude API (Haiku) for post-game coaching
- **Deploy:** Render (auto-deploys from GitHub main branch)

## Running Locally

```bash
# Backend
cd server
npm install
cp .env.example .env          # add ANTHROPIC_API_KEY and JWT_SECRET
npx prisma db push
npx ts-node prisma/seed.ts    # creates 15 mock KZ players, bosses, puzzle, cosmetics
npm run dev                   # starts on port 3001

# Frontend (new terminal)
cd client
npm install
npm run dev                   # starts on port 5173, proxies /api to 3001
```

Open `http://localhost:5173`

## Project Structure

```
damka/
├── client/
│   └── src/
│       ├── pages/        # Landing, Play, Game, Leaderboard, Bosses, Puzzle, Shop, Pro, Profile
│       ├── components/   # Board (absolute-positioned piece overlay), Navbar
│       └── lib/          # API client, Socket.IO wrapper, sounds (Web Audio API), confetti
├── server/
│   └── src/
│       ├── routes/       # REST: auth, leaderboard, bosses, puzzles, cosmetics, AI
│       ├── engine/       # Game rules: legal moves, captures, king promotion, AI (minimax)
│       ├── services/     # ELO calculation, city points, nemesis tracking
│       └── socket.ts     # WebSocket game loop: state sync, blitz clock, AI response
└── server/prisma/
    ├── schema.prisma     # SQLite schema
    └── seed.ts           # Seeded mock players, city scores, bosses, daily puzzle
```

## Game Engine

The game engine runs on the server. Clients send moves; the server validates against legal move tables and returns the new state. This prevents cheating and keeps a single source of truth for game state.

Legal move generation handles: standard diagonal moves, mandatory captures, multi-jump chains, king promotion (reaching the back rank), and king movement (any number of diagonal squares in Russian rules).

AI opponents use iterative-deepening minimax with alpha-beta pruning. Difficulty levels map to search depth: Easy (2-ply), Medium (4-ply), Hard (6-ply).

## Deployment Notes

Render free tier uses ephemeral storage. The SQLite database resets on each deploy. The start command runs `prisma db push` and the seed script before starting the server — players, bosses, cosmetics, and the daily puzzle are re-created on every deploy.

Set these environment variables in Render:
- `ANTHROPIC_API_KEY` — required for AI coaching
- `JWT_SECRET` — any long random string
- `NODE_ENV=production`

---

*Built for nFactorial School — May 2026*
