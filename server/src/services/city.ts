import prisma from '../prisma';

export async function addCityPoints(city: string, points: number) {
  const weekStart = getWeekStart();
  await prisma.cityWeeklyScore.upsert({
    where: { weekStart_city: { weekStart, city } },
    update: { totalPoints: { increment: points } },
    create: { weekStart, city, totalPoints: points },
  });
}

export function getWeekStart(): Date {
  const d = new Date(); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}
