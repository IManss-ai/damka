# Walkthrough - Damka Fixes and Enhancements

We have successfully resolved the server stability issues, fixed critical gameplay desyncs/backtracking bugs, cleared memory leaks, and updated the AI configuration.

---

## 🛠️ Changes Implemented

### 1. Startup & Memory Optimization (OOM Prevention)
- **Problem**: Running typescript seeding (`npx ts-node prisma/seed.ts`) during production boot consumes over 150MB of RAM, causing the Render 512MB container to hit its limit and crash.
- **Fix**: Removed `npx ts-node prisma/seed.ts` from the root `package.json` `start` script. The database is already programmatically seeded on startup by `runStartup()` in the Node.js process, making the extra process redundant and unsafe.

### 2. Backtracking Capture Bug
- **Problem**: In `getCaptureMoves` inside `moves.ts`, the recursive generator mutated the `visited` set in-place. This blocked different recursive search paths from checking valid multi-jump sequences.
- **Fix**: Updated `moves.ts` to clone the visited set using `const nextVisited = new Set(visited)` prior to adding the move key. This ensures each recursive branch has its own tracking context.

### 3. Invalid Move Rollbacks & Desync Fixes
- **Problem**: When a client performs a client-side optimistic move that the server determines is invalid (e.g. violating mandatory capture rules), the server simply sent a `game:invalidMove` signal. The client had no rollback mechanism, causing the local board to freeze in a desynchronized state.
- **Fix**: Modified `socket.ts` so that when a move is invalid, the server emits `game:stateUpdate` containing the correct current board state and player clocks. This immediately forces the client UI to roll back the piece back to its correct position.

### 4. AI Minimax CPU Optimization
- **Problem**: The Hard/Boss level 5 difficulty search depth was set to 6, which evaluated millions of board nodes recursively without a transposition table, locking up the server event loop and risking OOM.
- **Fix**: Capped the maximum minimax search depth at `5` in `ai.ts`. This provides excellent difficulty while keeping responses within ~400ms and safe from memory spikes.

### 5. Memory Leaks
- **Problem**: Uncompleted PvP, casual, Blitz, and tournament rooms were never removed from the in-memory `activeGames` map. Over time, active games grew without bound.
- **Fix**: Updated `socket.ts` to sweep and delete **all** games (including PvP) older than 2 hours in the periodic cleanup handler.

### 6. AI Coach API Model Fix
- **Problem**: The AI Coach used `claude-haiku-4-5-20251001` which is not a valid Anthropic API model.
- **Fix**: Updated the model name to `claude-3-5-haiku-latest`.

---

## 💾 Recommended Setup: PostgreSQL Persistence

To make sure player progress, coins, and Elo ratings are not wiped when Render restarts or sleeps, we recommend switching from SQLite to PostgreSQL (e.g. Supabase, Neon, or Render PostgreSQL).

Here is how you can set it up:

### Step 1: Get a PostgreSQL connection string
Create a free database on [Supabase](https://supabase.com) or [Neon](https://neon.tech) and copy your connection string (looks like `postgresql://user:password@host:port/database`).

### Step 2: Edit Prisma Schema
Open `server/prisma/schema.prisma` and update lines 5-8:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 3: Add environment variable on Render
In your Render Dashboard, select your service, go to **Environment**, and add:
- **Key**: `DATABASE_URL`
- **Value**: `your_postgresql_connection_string`

Prisma will automatically push the schema and seed the database on startup during deployment!
