import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed bosses
  const bosses = [
    { id: 1, name: 'The Apprentice', personality: 'Cautious, makes minor blunders', eloStrength: 900, rewardType: 'board', rewardName: 'Bronze Oak Board', description: 'A beginner who just learned the rules. Beat them to start your Boss Rush journey.' },
    { id: 2, name: 'The Tactician', personality: 'Solid fundamentals, rarely blunders', eloStrength: 1100, rewardType: 'piece', rewardName: 'Silver Coins Set', description: 'Knows the basics well. You will need to think two moves ahead.' },
    { id: 3, name: 'The Aggressor', personality: 'Attacks relentlessly, weak defense', eloStrength: 1300, rewardType: 'fx', rewardName: 'Lightning Capture FX', description: 'Comes at you hard from the start. Find the gaps in their offense.' },
    { id: 4, name: 'The Sage', personality: 'Positional master, almost never blunders', eloStrength: 1500, rewardType: 'board', rewardName: 'Golden Marble Board', description: 'Patient, strategic, deadly. Every move has a purpose.' },
    { id: 5, name: 'The Grandmaster', personality: 'Near-perfect play', eloStrength: 1800, rewardType: 'piece', rewardName: 'Legendary Crown Set', description: 'The final boss. Almost unbeatable. Are you ready?' },
  ];
  for (const boss of bosses) await prisma.boss.upsert({ where: { id: boss.id }, update: {}, create: boss });

  // Seed cosmetics
  const cosmetics = [
    { type: 'board', name: 'Classic Wood', price: 0, rarity: 'common', cssClass: 'board-classic' },
    { type: 'board', name: 'Dark Marble', price: 300, rarity: 'rare', cssClass: 'board-marble' },
    { type: 'board', name: 'Ocean Blue', price: 300, rarity: 'rare', cssClass: 'board-ocean' },
    { type: 'board', name: 'Neon Grid', price: 500, rarity: 'epic', cssClass: 'board-neon' },
    { type: 'piece', name: 'Classic', price: 0, rarity: 'common', cssClass: 'piece-classic' },
    { type: 'piece', name: 'Crystal', price: 400, rarity: 'epic', cssClass: 'piece-crystal' },
    { type: 'piece', name: 'Emoji 😄', price: 250, rarity: 'rare', cssClass: 'piece-emoji' },
    { type: 'fx', name: 'Sparkle', price: 200, rarity: 'common', cssClass: 'fx-sparkle' },
    { type: 'fx', name: 'Fireworks', price: 400, rarity: 'rare', cssClass: 'fx-fireworks' },
  ];
  for (const c of cosmetics) await prisma.cosmetic.create({ data: c }).catch(() => {});

  console.log('Seed complete ✅');
}

main().catch(console.error).finally(() => prisma.$disconnect());
