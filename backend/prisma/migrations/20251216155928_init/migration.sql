/*
  Warnings:

  - The values [LIVE,DISBANDED] on the enum `TournamentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `customName` on the `PlayerGame` table. All the data in the column will be lost.
  - You are about to drop the column `game` on the `PlayerGame` table. All the data in the column will be lost.
  - You are about to drop the column `playerIdOnGame` on the `PlayerGame` table. All the data in the column will be lost.
  - You are about to drop the column `public` on the `PlayerGame` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `SocialLink` table. All the data in the column will be lost.
  - You are about to drop the column `game` on the `Team` table. All the data in the column will be lost.
  - The `status` column on the `TeamJoinRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isHosted` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `game` on the `TournamentGame` table. All the data in the column will be lost.
  - The `status` column on the `TournamentJoinRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[profileId,gameId]` on the table `PlayerGame` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tournamentId,gameId]` on the table `TournamentGame` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tournamentId,userId]` on the table `TournamentJoinRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tournamentId,userId]` on the table `TournamentOrganizer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tournamentId,userId]` on the table `TournamentParticipant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tournamentId,userId,gameId]` on the table `TournamentRegistration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gameId` to the `PlayerGame` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameId` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameId` to the `TournamentGame` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameId` to the `TournamentRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "TournamentStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Tournament" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tournament" ALTER COLUMN "status" TYPE "TournamentStatus_new" USING ("status"::text::"TournamentStatus_new");
ALTER TYPE "TournamentStatus" RENAME TO "TournamentStatus_old";
ALTER TYPE "TournamentStatus_new" RENAME TO "TournamentStatus";
DROP TYPE "public"."TournamentStatus_old";
ALTER TABLE "Tournament" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropIndex
DROP INDEX "PlayerGame_profileId_game_key";

-- DropIndex
DROP INDEX "TournamentRegistration_tournamentId_userId_key";

-- AlterTable
ALTER TABLE "PlayerGame" DROP COLUMN "customName",
DROP COLUMN "game",
DROP COLUMN "playerIdOnGame",
DROP COLUMN "public",
ADD COLUMN     "gameId" INTEGER NOT NULL,
ADD COLUMN     "inGameName" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "playerTag" TEXT;

-- AlterTable
ALTER TABLE "SocialLink" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "game",
ADD COLUMN     "gameId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TeamJoinRequest" DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "isHosted";

-- AlterTable
ALTER TABLE "TournamentGame" DROP COLUMN "game",
ADD COLUMN     "gameId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TournamentJoinRequest" DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "TournamentRegistration" ADD COLUMN     "gameId" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "Game";

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGame_profileId_gameId_key" ON "PlayerGame"("profileId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGame_tournamentId_gameId_key" ON "TournamentGame"("tournamentId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentJoinRequest_tournamentId_userId_key" ON "TournamentJoinRequest"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentOrganizer_tournamentId_userId_key" ON "TournamentOrganizer"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_tournamentId_userId_key" ON "TournamentParticipant"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentRegistration_tournamentId_userId_gameId_key" ON "TournamentRegistration"("tournamentId", "userId", "gameId");

-- AddForeignKey
ALTER TABLE "PlayerGame" ADD CONSTRAINT "PlayerGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGame" ADD CONSTRAINT "TournamentGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
