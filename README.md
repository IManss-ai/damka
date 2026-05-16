# Damka — Competitive Checkers Platform

> Russian checkers (шашки), reimagined as a competitive platform with live multiplayer, AI coaching, and city rivalries.

🔗 **Live:** [coming soon — deploying to Railway]
📦 **GitHub:** [this repo]

---

## What is this?

Damka is not just a checkers game. It's a competitive platform designed to make every game matter.

**What makes it different:**

| Feature | Description |
|---------|-------------|
| 🤖 AI Coach | Post-game analysis by Claude AI — explains your best and worst moves |
| ⚔️ Live Multiplayer | Real-time games via WebSockets. Share a link, play instantly |
| 🌍 City Rivalries | Your wins count toward your city's weekly score. Almaty vs Astana. |
| 👹 Boss Rush | 5 progressively harder AI opponents. Beat them all to unlock rare cosmetics |
| 🧩 Daily Puzzle | One tactical puzzle per day. Global speed ranking |
| 🎨 Cosmetics Shop | Unique piece skins and board themes. Buy with in-game coins |
| 📊 ELO Ranking | Real rating system. Climb the leaderboard, find your rival |

---

## For whom?

Competitive players who want more than a "checkers board." People who care about skill improvement, social comparison, and progression systems.

---

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Framer Motion
- **Backend:** Node.js + Express + Socket.IO + Prisma + SQLite
- **AI:** Claude API (Haiku) for game analysis
- **Deploy:** Railway (full-stack, single service)

---

## Running Locally

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Set up database
cd server
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and JWT_SECRET
npx prisma migrate dev
npx ts-node prisma/seed.ts

# Start backend (port 3001)
npm run dev

# Start frontend (port 5173, new terminal)
cd ../client && npm run dev
```

Open `http://localhost:5173`

---

## Architecture

```
damka/
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/   # Landing, Play, Game, Leaderboard, Bosses, Puzzle, Shop...
│       ├── components/  # Board, Navbar
│       └── lib/     # API client, Socket.IO, sounds, confetti
├── server/          # Express + Socket.IO backend
│   └── src/
│       ├── routes/  # REST API (auth, leaderboard, AI, bosses...)
│       ├── engine/  # Game rules engine (moves, captures, kings)
│       └── socket.ts  # Real-time game loop
└── railway.json     # Deploy config
```

---

## What I Learned / Showed

This isn't a homework checkers board. It's a product prototype that demonstrates:

1. **Full-stack thinking** — Auth, persistence, real-time communication, AI integration
2. **Game loop architecture** — WebSocket-based state sync, legal move validation on server
3. **Product differentiation** — City meta, Boss Rush, and AI Coach are features you can pitch
4. **Monetization thinking** — Coins + cosmetics shop shows awareness of retention mechanics

The platform could realistically grow. That was the goal.

---

*Built for nFactorial School checkers competition — May 2026*
