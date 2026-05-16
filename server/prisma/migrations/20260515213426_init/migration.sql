-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Almaty',
    "eloRating" INTEGER NOT NULL DEFAULT 1200,
    "coins" INTEGER NOT NULL DEFAULT 500,
    "bossesBeaten" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" DATETIME,
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "nemesisId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Game_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Boss" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "eloStrength" INTEGER NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardName" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BossProgress" (
    "userId" TEXT NOT NULL,
    "bossId" INTEGER NOT NULL,
    "beaten" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "beatenAt" DATETIME,

    PRIMARY KEY ("userId", "bossId"),
    CONSTRAINT "BossProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BossProgress_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "Boss" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyPuzzle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "boardState" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3
);

-- CreateTable
CREATE TABLE "PuzzleAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "movesUsed" INTEGER NOT NULL DEFAULT 0,
    "timeSeconds" INTEGER NOT NULL DEFAULT 0,
    "solvedAt" DATETIME,
    CONSTRAINT "PuzzleAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PuzzleAttempt_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "DailyPuzzle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cosmetic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 200,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "cssClass" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "UserCosmetic" (
    "userId" TEXT NOT NULL,
    "cosmeticId" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "acquiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "cosmeticId"),
    CONSTRAINT "UserCosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserCosmetic_cosmeticId_fkey" FOREIGN KEY ("cosmeticId") REFERENCES "Cosmetic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CityWeeklyScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStart" DATETIME NOT NULL,
    "city" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "bracket" TEXT NOT NULL DEFAULT '{}',
    "prizePool" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TournamentPlayer" (
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "eliminated" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("tournamentId", "userId"),
    CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TournamentPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NemesisRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "p1Wins" INTEGER NOT NULL DEFAULT 0,
    "p2Wins" INTEGER NOT NULL DEFAULT 0,
    "isNemesis" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "NemesisRecord_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NemesisRecord_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GhostGame" (
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "isPersonalBest" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("userId", "gameId"),
    CONSTRAINT "GhostGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GhostGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
