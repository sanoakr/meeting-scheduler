/*
  Warnings:

  - You are about to drop the column `dateTime` on the `Candidate` table. All the data in the column will be lost.
  - Added the required column `endDateTime` to the `Candidate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDateTime` to the `Candidate` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Candidate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "startDateTime" DATETIME NOT NULL,
    "endDateTime" DATETIME NOT NULL,
    "groupId" TEXT NOT NULL,
    CONSTRAINT "Candidate_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Candidate" ("groupId", "id", "name") SELECT "groupId", "id", "name" FROM "Candidate";
DROP TABLE "Candidate";
ALTER TABLE "new_Candidate" RENAME TO "Candidate";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
