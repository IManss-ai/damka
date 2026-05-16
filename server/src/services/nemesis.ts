import prisma from '../prisma';

export async function updateNemesis(winnerId: string, loserId: string) {
  const [p1, p2] = [winnerId, loserId].sort();
  const isP1Winner = p1 === winnerId;
  const record = await prisma.nemesisRecord.upsert({
    where: { player1Id_player2Id: { player1Id: p1, player2Id: p2 } },
    update: isP1Winner ? { p1Wins: { increment: 1 } } : { p2Wins: { increment: 1 } },
    create: { player1Id: p1, player2Id: p2, p1Wins: isP1Winner ? 1 : 0, p2Wins: isP1Winner ? 0 : 1 },
  });
  const isNemesis = Math.abs(record.p1Wins - record.p2Wins) >= 2;
  if (isNemesis) {
    await prisma.nemesisRecord.update({ where: { id: record.id }, data: { isNemesis: true } });
    const leaderId = record.p1Wins > record.p2Wins ? p1 : p2;
    const followerId = leaderId === p1 ? p2 : p1;
    await prisma.user.update({ where: { id: followerId }, data: { nemesisId: leaderId } });
  }
}
