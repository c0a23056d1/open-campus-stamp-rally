-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Spot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spotName" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "description" TEXT,
    "qrSecretCode" TEXT NOT NULL,
    "x" INTEGER NOT NULL DEFAULT 0,
    "y" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Spot" ("description", "floor", "id", "qrSecretCode", "spotName") SELECT "description", "floor", "id", "qrSecretCode", "spotName" FROM "Spot";
DROP TABLE "Spot";
ALTER TABLE "new_Spot" RENAME TO "Spot";
CREATE UNIQUE INDEX "Spot_qrSecretCode_key" ON "Spot"("qrSecretCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
