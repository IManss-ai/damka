-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Almaty',
    "eloRating" INTEGER NOT NULL DEFAULT 1200,
    "coins" INTEGER NOT NULL DEFAULT 500,
    "bossesBeaten" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "nemesisId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "whitePlayerId" TEXT NOT NULL,
    "blackPlayerId" TEXT,
    "moves" TEXT NOT NULL DEFAULT '[]',
    "result" TEXT NOT NULL DEFAULT 'ongoing',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "wagerAmount" INTEGER NOT NULL DEFAULT 0,
    "eloChange" INTEGER NOT NULL DEFAULT 0,
    "gameMode" TEXT NOT NULL DEFAULT 'casual',
    "aiDifficulty" TEXT,
    "bossId" INTEGER,
    "matchStory" TEXT,
    "isSpectatable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boss" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "eloStrength" INTEGER NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "Boss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BossProgress" (
    "userId" TEXT NOT NULL,
    "bossId" INTEGER NOT NULL,
    "beaten" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "beatenAt" TIMESTAMP(3),
    CONSTRAINT "BossProgress_pkey" PRIMARY KEY ("userId","bossId")
);

-- CreateTable
CREATE TABLE "DailyPuzzle" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "boardState" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    CONSTRAINT "DailyPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuzzleAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "movesUsed" INTEGER NOT NULL DEFAULT 0,
    "timeSeconds" INTEGER NOT NULL DEFAULT 0,
    "solvedAt" TIMESTAMP(3),
    CONSTRAINT "PuzzleAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cosmetic" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 200,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "cssClass" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Cosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCosmetic" (
    "userId" TEXT NOT NULL,
    "cosmeticId" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserCosmetic_pkey" PRIMARY KEY ("userId","cosmeticId")
);

-- CreateTable
CREATE TABLE "CityWeeklyScore" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CityWeeklyScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "bracket" TEXT NOT NULL DEFAULT '{}',
    "prizePool" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentPlayer" (
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "eliminated" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TournamentPlayer_pkey" PRIMARY KEY ("tournamentId","userId")
);

-- CreateTable
CREATE TABLE "NemesisRecord" (
    "id" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "p1Wins" INTEGER NOT NULL DEFAULT 0,
    "p2Wins" INTEGER NOT NULL DEFAULT 0,
    "isNemesis" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "NemesisRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhostGame" (
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "isPersonalBest" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GhostGame_pkey" PRIMARY KEY ("userId","gameId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPuzzle_date_key" ON "DailyPuzzle"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleAttempt_userId_puzzleId_key" ON "PuzzleAttempt"("userId", "puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "CityWeeklyScore_weekStart_city_key" ON "CityWeeklyScore"("weekStart", "city");

-- CreateIndex
CREATE UNIQUE INDEX "NemesisRecord_player1Id_player2Id_key" ON "NemesisRecord"("player1Id", "player2Id");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BossProgress" ADD CONSTRAINT "BossProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BossProgress" ADD CONSTRAINT "BossProgress_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "Boss"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleAttempt" ADD CONSTRAINT "PuzzleAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuzzleAttempt" ADD CONSTRAINT "PuzzleAttempt_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "DailyPuzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_cosmeticId_fkey" FOREIGN KEY ("cosmeticId") REFERENCES "Cosmetic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPlayer" ADD CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPlayer" ADD CONSTRAINT "TournamentPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NemesisRecord" ADD CONSTRAINT "NemesisRecord_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NemesisRecord" ADD CONSTRAINT "NemesisRecord_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostGame" ADD CONSTRAINT "GhostGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostGame" ADD CONSTRAINT "GhostGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
