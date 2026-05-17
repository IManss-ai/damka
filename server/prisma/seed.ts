import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MOCK_PLAYERS = [
  { username: 'Arman_KZ', city: 'Almaty', elo: 1847, wins: 312, games: 380 },
  { username: 'ZhansayaQ', city: 'Astana', elo: 1791, wins: 289, games: 341 },
  { username: 'Darkhan_Pro', city: 'Almaty', elo: 1734, wins: 201, games: 260 },
  { username: 'AigulShymkent', city: 'Shymkent', elo: 1682, wins: 178, games: 230 },
  { username: 'NurbolTactician', city: 'Karaganda', elo: 1651, wins: 156, games: 208 },
  { username: 'Beibut_Almaty', city: 'Almaty', elo: 1623, wins: 143, games: 195 },
  { username: 'SultanAstana', city: 'Astana', elo: 1589, wins: 134, games: 189 },
  { username: 'Dinara_Q', city: 'Aktobe', elo: 1541, wins: 112, games: 162 },
  { username: 'TimurPawlodar', city: 'Pavlodar', elo: 1498, wins: 98, games: 148 },
  { username: 'KazakhKing', city: 'Taraz', elo: 1467, wins: 89, games: 134 },
  { username: 'AkbikenShym', city: 'Shymkent', elo: 1423, wins: 76, games: 121 },
  { username: 'Ruslan_kz', city: 'Karaganda', elo: 1398, wins: 67, games: 112 },
  { username: 'Madina_Pro', city: 'Astana', elo: 1356, wins: 58, games: 99 },
  { username: 'AlexeyAlmaty', city: 'Almaty', elo: 1312, wins: 49, games: 88 },
  { username: 'ZarinaTaraz', city: 'Taraz', elo: 1278, wins: 41, games: 79 },
];

async function main() {
  // Bosses
  const bosses = [
    { id: 1, name: 'The Apprentice', personality: 'Cautious, makes minor blunders', eloStrength: 900, rewardType: 'board', rewardName: 'Bronze Oak Board', description: 'A beginner who just learned the rules. Beat them to start your Boss Rush journey.' },
    { id: 2, name: 'The Tactician', personality: 'Solid fundamentals, rarely blunders', eloStrength: 1100, rewardType: 'piece', rewardName: 'Silver Coins Set', description: 'Knows the basics well. You will need to think two moves ahead.' },
    { id: 3, name: 'The Aggressor', personality: 'Attacks relentlessly, weak defense', eloStrength: 1300, rewardType: 'fx', rewardName: 'Lightning Capture FX', description: 'Comes at you hard from the start. Find the gaps in their offense.' },
    { id: 4, name: 'The Sage', personality: 'Positional master, almost never blunders', eloStrength: 1500, rewardType: 'board', rewardName: 'Golden Marble Board', description: 'Patient, strategic, deadly. Every move has a purpose.' },
    { id: 5, name: 'The Grandmaster', personality: 'Near-perfect play', eloStrength: 1800, rewardType: 'piece', rewardName: 'Legendary Crown Set', description: 'The final boss. Almost unbeatable. Are you ready?' },
  ];
  for (const boss of bosses) {
    await prisma.boss.upsert({ where: { id: boss.id }, update: {}, create: boss });
  }

  // Cosmetics
  const cosmetics = [
    { type: 'board', name: 'Classic Wood', price: 0, rarity: 'common', cssClass: 'board-classic' },
    { type: 'board', name: 'Dark Marble', price: 300, rarity: 'rare', cssClass: 'board-marble' },
    { type: 'board', name: 'Ocean Blue', price: 300, rarity: 'rare', cssClass: 'board-ocean' },
    { type: 'board', name: 'Neon Grid', price: 500, rarity: 'epic', cssClass: 'board-neon' },
    { type: 'piece', name: 'Classic', price: 0, rarity: 'common', cssClass: 'piece-classic' },
    { type: 'piece', name: 'Crystal', price: 400, rarity: 'epic', cssClass: 'piece-crystal' },
    { type: 'piece', name: 'Gold Rush', price: 600, rarity: 'legendary', cssClass: 'piece-gold' },
    { type: 'fx', name: 'Sparkle', price: 200, rarity: 'common', cssClass: 'fx-sparkle' },
    { type: 'fx', name: 'Fireworks', price: 400, rarity: 'rare', cssClass: 'fx-fireworks' },
  ];
  for (const c of cosmetics) {
    await prisma.cosmetic.create({ data: c }).catch(() => {});
  }

  // Mock players
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const createdUsers: any[] = [];

  for (const p of MOCK_PLAYERS) {
    const existing = await prisma.user.findUnique({ where: { username: p.username } });
    if (!existing) {
      const user = await prisma.user.create({
        data: {
          username: p.username,
          email: `${p.username.toLowerCase()}@damka.kz`,
          passwordHash,
          city: p.city,
          eloRating: p.elo,
          coins: Math.floor(Math.random() * 800) + 200,
          bossesBeaten: Math.floor(Math.random() * 5),
          streak: Math.floor(Math.random() * 14),
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
      createdUsers.push({ ...user, wins: p.wins, games: p.games });
    }
  }

  // City weekly scores
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const cityScores: Record<string, number> = {
    'Almaty': 847,
    'Astana': 734,
    'Shymkent': 521,
    'Karaganda': 389,
    'Aktobe': 267,
    'Pavlodar': 198,
    'Taraz': 156,
  };

  for (const [city, points] of Object.entries(cityScores)) {
    await prisma.cityWeeklyScore.upsert({
      where: { weekStart_city: { weekStart, city } },
      update: { totalPoints: points },
      create: { weekStart, city, totalPoints: points, rank: 0 },
    });
  }

  // Daily puzzle — hand-crafted, cycled by day-of-week.
  // Each position is white-to-move with a forced winning capture.
  type PieceDef = { color: 'white' | 'black'; type?: 'man' | 'king'; row: number; col: number };

  function buildBoard(pieces: PieceDef[]) {
    const board: any[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    pieces.forEach((p, i) => {
      board[p.row][p.col] = {
        id: `${p.color[0]}${p.type === 'king' ? 'k' : ''}${i}`,
        color: p.color,
        type: p.type ?? 'man',
        row: p.row,
        col: p.col,
      };
    });
    return board;
  }

  const PUZZLES: { name: string; pieces: PieceDef[]; solution: any[]; difficulty: number }[] = [
    // Sunday (0) — single capture, learn the rule
    {
      name: 'Quick Strike',
      pieces: [
        { color: 'white', row: 5, col: 2 }, { color: 'white', row: 7, col: 0 }, { color: 'white', row: 6, col: 5 },
        { color: 'black', row: 4, col: 3 }, { color: 'black', row: 1, col: 4 }, { color: 'black', row: 0, col: 3 },
      ],
      solution: [{ from: { row: 5, col: 2 }, to: { row: 3, col: 4 }, captures: [{ row: 4, col: 3 }] }],
      difficulty: 1,
    },
    // Monday (1) — double jump combination
    {
      name: 'The Combination',
      pieces: [
        { color: 'white', row: 5, col: 2 }, { color: 'white', row: 6, col: 1 }, { color: 'white', row: 7, col: 4 },
        { color: 'black', row: 4, col: 3 }, { color: 'black', row: 2, col: 5 }, { color: 'black', row: 0, col: 3 },
      ],
      solution: [{ from: { row: 5, col: 2 }, to: { row: 1, col: 6 }, captures: [{ row: 4, col: 3 }, { row: 2, col: 5 }] }],
      difficulty: 2,
    },
    // Tuesday (2) — triple cascade
    {
      name: 'Cascading Captures',
      pieces: [
        { color: 'white', row: 5, col: 4 }, { color: 'white', row: 7, col: 0 }, { color: 'white', row: 7, col: 2 },
        { color: 'black', row: 4, col: 3 }, { color: 'black', row: 2, col: 3 }, { color: 'black', row: 2, col: 5 },
        { color: 'black', row: 0, col: 1 },
      ],
      solution: [{ from: { row: 5, col: 4 }, to: { row: 3, col: 6 }, captures: [{ row: 4, col: 3 }, { row: 2, col: 3 }, { row: 2, col: 5 }] }],
      difficulty: 3,
    },
    // Wednesday (3) — breakthrough to king row
    {
      name: 'Promotion Path',
      pieces: [
        { color: 'white', row: 2, col: 3 }, { color: 'white', row: 5, col: 6 }, { color: 'white', row: 6, col: 3 },
        { color: 'black', row: 1, col: 4 }, { color: 'black', row: 1, col: 2 }, { color: 'black', row: 4, col: 5 },
      ],
      solution: [{ from: { row: 2, col: 3 }, to: { row: 0, col: 5 }, captures: [{ row: 1, col: 4 }] }],
      difficulty: 2,
    },
    // Thursday (4) — king's reach
    {
      name: "King's Reach",
      pieces: [
        { color: 'white', type: 'king', row: 4, col: 3 }, { color: 'white', row: 7, col: 0 }, { color: 'white', row: 7, col: 4 },
        { color: 'black', row: 3, col: 4 }, { color: 'black', row: 1, col: 6 }, { color: 'black', row: 0, col: 1 },
      ],
      solution: [{ from: { row: 4, col: 3 }, to: { row: 0, col: 7 }, captures: [{ row: 3, col: 4 }, { row: 1, col: 6 }] }],
      difficulty: 3,
    },
    // Friday (5) — tactical isolation
    {
      name: 'Tactical Fork',
      pieces: [
        { color: 'white', row: 4, col: 5 }, { color: 'white', row: 6, col: 3 }, { color: 'white', row: 7, col: 6 },
        { color: 'black', row: 3, col: 6 }, { color: 'black', row: 1, col: 4 }, { color: 'black', row: 0, col: 7 },
      ],
      solution: [{ from: { row: 4, col: 5 }, to: { row: 2, col: 7 }, captures: [{ row: 3, col: 6 }] }],
      difficulty: 2,
    },
    // Saturday (6) — endgame execution
    {
      name: 'Endgame Combination',
      pieces: [
        { color: 'white', row: 5, col: 0 }, { color: 'white', row: 5, col: 4 }, { color: 'white', row: 7, col: 6 },
        { color: 'black', row: 4, col: 1 }, { color: 'black', row: 2, col: 3 }, { color: 'black', row: 0, col: 1 },
      ],
      solution: [{ from: { row: 5, col: 0 }, to: { row: 1, col: 4 }, captures: [{ row: 4, col: 1 }, { row: 2, col: 3 }] }],
      difficulty: 2,
    },
  ];

  // Seed all 7 puzzles for the next 7 days (so /api/puzzles/daily always finds one)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay();
    const puzzle = PUZZLES[dayOfWeek];

    const existing = await prisma.dailyPuzzle.findFirst({ where: { date } });
    if (existing) {
      await prisma.dailyPuzzle.update({
        where: { id: existing.id },
        data: {
          boardState: JSON.stringify({ board: buildBoard(puzzle.pieces), currentTurn: 'white', name: puzzle.name }),
          solution: JSON.stringify(puzzle.solution),
          difficulty: puzzle.difficulty,
        },
      });
    } else {
      await prisma.dailyPuzzle.create({
        data: {
          date,
          boardState: JSON.stringify({ board: buildBoard(puzzle.pieces), currentTurn: 'white', name: puzzle.name }),
          solution: JSON.stringify(puzzle.solution),
          difficulty: puzzle.difficulty,
        },
      });
    }
  }

  console.log('Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
