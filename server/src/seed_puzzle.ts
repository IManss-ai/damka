import prisma from './prisma';

// Build a board the same way the engine does (dark squares only: (row+col)%2===1)
// Puzzle: white at (5,4), black at (4,3) → white captures moving to (3,2)
const board: (any | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

// Black pieces (top area)
board[0][1] = { id: 'b0', color: 'black', type: 'man', row: 0, col: 1 };
board[0][3] = { id: 'b1', color: 'black', type: 'man', row: 0, col: 3 };
board[0][5] = { id: 'b2', color: 'black', type: 'man', row: 0, col: 5 };
board[1][2] = { id: 'b3', color: 'black', type: 'man', row: 1, col: 2 };
board[1][6] = { id: 'b4', color: 'black', type: 'man', row: 1, col: 6 };
// The piece to be captured
board[4][3] = { id: 'b5', color: 'black', type: 'man', row: 4, col: 3 };

// White pieces (bottom area)
board[5][4] = { id: 'w0', color: 'white', type: 'man', row: 5, col: 4 }; // attacking piece
board[6][1] = { id: 'w1', color: 'white', type: 'man', row: 6, col: 1 };
board[6][5] = { id: 'w2', color: 'white', type: 'man', row: 6, col: 5 };
board[7][0] = { id: 'w3', color: 'white', type: 'man', row: 7, col: 0 };
board[7][4] = { id: 'w4', color: 'white', type: 'man', row: 7, col: 4 };

const boardState = JSON.stringify(board);
// Solution: w0 at (5,4) captures b5 at (4,3) and lands at (3,2)
const solution = JSON.stringify([{ from: { row: 5, col: 4 }, to: { row: 3, col: 2 }, captures: [{ row: 4, col: 3 }] }]);

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyPuzzle.deleteMany({ where: { date: today } });

  const puzzle = await prisma.dailyPuzzle.create({
    data: { date: today, boardState, solution, difficulty: 2 },
  });
  console.log('Created puzzle:', puzzle.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
