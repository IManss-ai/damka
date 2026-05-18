// Runs on every server start: creates tables + seeds reference data.
// Idempotent — safe to call multiple times.
import prisma from './prisma';
import bcrypt from 'bcryptjs';

export async function runStartup() {
  try {
    const bossCount = await prisma.boss.count();
    if (bossCount === 0) await seedBosses();

    const cosmeticCount = await prisma.cosmetic.count();
    if (cosmeticCount === 0) await seedCosmetics();
    // Always sync prices so existing DBs pick up the affordable pricing tier
    // (users start with 500 coins — the old 300-600 prices left nothing buyable).
    await syncCosmeticPrices();

    await seedMockPlayers();
    await seedCityScores();
    await seedPuzzles();

    console.log('[startup] seed complete');
  } catch (err) {
    console.error('[startup] seed error (non-fatal):', err);
  }
}

async function seedBosses() {
  const bosses = [
    { id: 1, name: 'The Apprentice', personality: 'Cautious, makes minor blunders', eloStrength: 900, rewardType: 'board', rewardName: 'Bronze Oak Board', description: 'A beginner who just learned the rules.' },
    { id: 2, name: 'The Tactician', personality: 'Solid fundamentals, rarely blunders', eloStrength: 1100, rewardType: 'piece', rewardName: 'Silver Coins Set', description: 'Knows the basics well. Think two moves ahead.' },
    { id: 3, name: 'The Aggressor', personality: 'Attacks relentlessly, weak defense', eloStrength: 1300, rewardType: 'fx', rewardName: 'Lightning Capture FX', description: 'Comes at you hard. Find the gaps in their offense.' },
    { id: 4, name: 'The Sage', personality: 'Positional master, almost never blunders', eloStrength: 1500, rewardType: 'board', rewardName: 'Golden Marble Board', description: 'Patient, strategic, deadly.' },
    { id: 5, name: 'The Grandmaster', personality: 'Near-perfect play', eloStrength: 1800, rewardType: 'piece', rewardName: 'Legendary Crown Set', description: 'The final boss. Almost unbeatable.' },
  ];
  for (const boss of bosses) {
    await prisma.boss.upsert({ where: { id: boss.id }, update: {}, create: boss });
  }
}

// Single source of truth for cosmetic catalog + prices. Tiered so a fresh
// account (500 coins) can comfortably buy 2-3 items.
//   common 50-100 | rare 150-200 | epic 250-350 | legendary 400-500
const COSMETIC_CATALOG = [
  { type: 'board', name: 'Classic Wood',    price: 0,   rarity: 'common',    cssClass: 'board-classic' },
  { type: 'board', name: 'Dark Marble',     price: 200, rarity: 'rare',      cssClass: 'board-marble' },
  { type: 'board', name: 'Ocean Blue',      price: 200, rarity: 'rare',      cssClass: 'board-ocean' },
  { type: 'board', name: 'Neon Grid',       price: 300, rarity: 'epic',      cssClass: 'board-neon' },
  { type: 'piece', name: 'Classic',         price: 0,   rarity: 'common',    cssClass: 'piece-classic' },
  { type: 'piece', name: 'Crystal',         price: 300, rarity: 'epic',      cssClass: 'piece-crystal' },
  { type: 'piece', name: 'Gold Rush',       price: 500, rarity: 'legendary', cssClass: 'piece-gold' },
  { type: 'fx',    name: 'Sparkle',         price: 100, rarity: 'common',    cssClass: 'fx-sparkle' },
  { type: 'fx',    name: 'Fireworks',       price: 200, rarity: 'rare',      cssClass: 'fx-fireworks' },
  { type: 'board', name: 'Crimson Felt',    price: 200, rarity: 'rare',      cssClass: 'board-crimson' },
  { type: 'board', name: 'Midnight Stars',  price: 350, rarity: 'epic',      cssClass: 'board-stars' },
  { type: 'piece', name: 'Ruby Red',        price: 200, rarity: 'rare',      cssClass: 'piece-ruby' },
  { type: 'piece', name: 'Obsidian Dark',   price: 350, rarity: 'epic',      cssClass: 'piece-obsidian' },
  { type: 'fx',    name: 'Golden Trail',    price: 200, rarity: 'rare',      cssClass: 'fx-golden' },
  { type: 'fx',    name: 'Storm Flash',     price: 500, rarity: 'legendary', cssClass: 'fx-storm' },
];

async function seedCosmetics() {
  for (const c of COSMETIC_CATALOG) {
    await prisma.cosmetic.create({ data: c }).catch(() => {});
  }
}

async function syncCosmeticPrices() {
  // Cosmetic.name isn't unique in the schema, so use updateMany to keep prices,
  // rarity and cssClass aligned with the catalog every boot.
  for (const c of COSMETIC_CATALOG) {
    await prisma.cosmetic.updateMany({
      where: { name: c.name },
      data: { price: c.price, rarity: c.rarity, cssClass: c.cssClass, type: c.type },
    }).catch(() => {});
  }
}

async function seedMockPlayers() {
  const MOCK = [
    { username: 'Arman_KZ', city: 'Almaty', elo: 1847 },
    { username: 'ZhansayaQ', city: 'Astana', elo: 1791 },
    { username: 'Darkhan_Pro', city: 'Almaty', elo: 1734 },
    { username: 'AigulShymkent', city: 'Shymkent', elo: 1682 },
    { username: 'NurbolTactician', city: 'Karaganda', elo: 1651 },
    { username: 'Beibut_Almaty', city: 'Almaty', elo: 1623 },
    { username: 'SultanAstana', city: 'Astana', elo: 1589 },
    { username: 'Dinara_Q', city: 'Aktobe', elo: 1541 },
    { username: 'TimurPawlodar', city: 'Pavlodar', elo: 1498 },
    { username: 'KazakhKing', city: 'Taraz', elo: 1467 },
    { username: 'AkbikenShym', city: 'Shymkent', elo: 1423 },
    { username: 'Ruslan_kz', city: 'Karaganda', elo: 1398 },
    { username: 'Madina_Pro', city: 'Astana', elo: 1356 },
    { username: 'AlexeyAlmaty', city: 'Almaty', elo: 1312 },
    { username: 'ZarinaTaraz', city: 'Taraz', elo: 1278 },
  ];
  const passwordHash = await bcrypt.hash('demo1234', 10);
  for (const p of MOCK) {
    const existing = await prisma.user.findUnique({ where: { username: p.username } });
    if (!existing) {
      await prisma.user.create({
        data: {
          username: p.username,
          email: `${p.username.toLowerCase()}@damka.kz`,
          passwordHash,
          city: p.city,
          eloRating: p.elo,
          coins: Math.floor(Math.random() * 800) + 200,
          bossesBeaten: Math.floor(Math.random() * 5),
          streak: Math.floor(Math.random() * 14),
        },
      }).catch(() => {});
    }
  }
}

async function seedCityScores() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const cityScores: Record<string, number> = {
    'Almaty': 847, 'Astana': 734, 'Shymkent': 521,
    'Karaganda': 389, 'Aktobe': 267, 'Pavlodar': 198, 'Taraz': 156,
  };
  for (const [city, points] of Object.entries(cityScores)) {
    await prisma.cityWeeklyScore.upsert({
      where: { weekStart_city: { weekStart, city } },
      update: {},
      create: { weekStart, city, totalPoints: points, rank: 0 },
    }).catch(() => {});
  }
}

type PieceDef = { color: 'white' | 'black'; type?: 'man' | 'king'; row: number; col: number };
function buildBoard(pieces: PieceDef[]) {
  const board: any[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  pieces.forEach((p, i) => {
    board[p.row][p.col] = { id: `${p.color[0]}${i}`, color: p.color, type: p.type ?? 'man', row: p.row, col: p.col };
  });
  return board;
}

async function seedPuzzles() {
  const PUZZLES = [
    { name: 'Quick Strike', pieces: [{ color: 'white' as const, row: 5, col: 2 }, { color: 'white' as const, row: 7, col: 0 }, { color: 'black' as const, row: 4, col: 3 }, { color: 'black' as const, row: 1, col: 4 }], solution: [{ from: { row: 5, col: 2 }, to: { row: 3, col: 4 }, captures: [{ row: 4, col: 3 }] }], difficulty: 1 },
    { name: 'The Combination', pieces: [{ color: 'white' as const, row: 5, col: 2 }, { color: 'black' as const, row: 4, col: 3 }, { color: 'black' as const, row: 2, col: 5 }], solution: [{ from: { row: 5, col: 2 }, to: { row: 1, col: 6 }, captures: [{ row: 4, col: 3 }, { row: 2, col: 5 }] }], difficulty: 2 },
    { name: 'Cascading Captures', pieces: [{ color: 'white' as const, row: 5, col: 4 }, { color: 'black' as const, row: 4, col: 3 }, { color: 'black' as const, row: 2, col: 5 }], solution: [{ from: { row: 5, col: 4 }, to: { row: 1, col: 6 }, captures: [{ row: 4, col: 3 }, { row: 2, col: 5 }] }], difficulty: 3 },
    { name: 'Promotion Path', pieces: [{ color: 'white' as const, row: 2, col: 3 }, { color: 'black' as const, row: 1, col: 4 }], solution: [{ from: { row: 2, col: 3 }, to: { row: 0, col: 5 }, captures: [{ row: 1, col: 4 }] }], difficulty: 2 },
    { name: "King's Reach", pieces: [{ color: 'white' as const, type: 'king' as const, row: 4, col: 3 }, { color: 'black' as const, row: 3, col: 4 }, { color: 'black' as const, row: 1, col: 6 }], solution: [{ from: { row: 4, col: 3 }, to: { row: 0, col: 7 }, captures: [{ row: 3, col: 4 }, { row: 1, col: 6 }] }], difficulty: 3 },
    { name: 'Tactical Fork', pieces: [{ color: 'white' as const, row: 4, col: 5 }, { color: 'black' as const, row: 3, col: 6 }, { color: 'black' as const, row: 1, col: 4 }], solution: [{ from: { row: 4, col: 5 }, to: { row: 2, col: 7 }, captures: [{ row: 3, col: 6 }] }], difficulty: 2 },
    { name: 'Endgame', pieces: [{ color: 'white' as const, row: 5, col: 0 }, { color: 'black' as const, row: 4, col: 1 }, { color: 'black' as const, row: 2, col: 3 }], solution: [{ from: { row: 5, col: 0 }, to: { row: 1, col: 4 }, captures: [{ row: 4, col: 1 }, { row: 2, col: 3 }] }], difficulty: 2 },
  ];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);
    const puzzle = PUZZLES[date.getDay()];
    const boardState = JSON.stringify({ board: buildBoard(puzzle.pieces), currentTurn: 'white', name: puzzle.name });
    const existing = await prisma.dailyPuzzle.findFirst({ where: { date } });
    if (existing) {
      await prisma.dailyPuzzle.update({ where: { id: existing.id }, data: { boardState, solution: JSON.stringify(puzzle.solution), difficulty: puzzle.difficulty } });
    } else {
      await prisma.dailyPuzzle.create({ data: { date, boardState, solution: JSON.stringify(puzzle.solution), difficulty: puzzle.difficulty } });
    }
  }
}
