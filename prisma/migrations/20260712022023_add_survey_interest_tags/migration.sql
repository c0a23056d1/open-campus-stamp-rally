-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SurveyResponse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "q1" INTEGER NOT NULL,
    "q2" INTEGER NOT NULL,
    "q3" INTEGER NOT NULL,
    "q4" INTEGER NOT NULL,
    "q5" INTEGER NOT NULL,
    "q6" INTEGER NOT NULL,
    "q7" INTEGER NOT NULL,
    "q8" INTEGER NOT NULL,
    "q9" INTEGER NOT NULL,
    "q10" INTEGER NOT NULL,
    "q11" INTEGER NOT NULL,
    "q12" INTEGER NOT NULL,
    "q13" INTEGER NOT NULL,
    "q14" INTEGER NOT NULL,
    "q15" INTEGER NOT NULL,
    "q16" INTEGER NOT NULL,
    "interestTagsJson" TEXT NOT NULL DEFAULT '[]',
    "goodPoint" TEXT,
    "improvePoint" TEXT,
    "futureRequest" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SurveyResponse" ("createdAt", "futureRequest", "goodPoint", "id", "improvePoint", "q1", "q10", "q11", "q12", "q13", "q14", "q15", "q16", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "userId") SELECT "createdAt", "futureRequest", "goodPoint", "id", "improvePoint", "q1", "q10", "q11", "q12", "q13", "q14", "q15", "q16", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "userId" FROM "SurveyResponse";
DROP TABLE "SurveyResponse";
ALTER TABLE "new_SurveyResponse" RENAME TO "SurveyResponse";
CREATE UNIQUE INDEX "SurveyResponse_userId_key" ON "SurveyResponse"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
