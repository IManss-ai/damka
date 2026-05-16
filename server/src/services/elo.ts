export function calculateElo(winnerElo: number, loserElo: number, k = 32): { winner: number; loser: number } {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const change = Math.round(k * (1 - expected));
  return { winner: winnerElo + change, loser: loserElo - change };
}

export function getRank(elo: number): string {
  if (elo < 1000) return 'Beginner';
  if (elo < 1200) return 'Club';
  if (elo < 1400) return 'Expert';
  if (elo < 1600) return 'Master';
  if (elo < 1800) return 'Grandmaster';
  return 'Legend';
}
