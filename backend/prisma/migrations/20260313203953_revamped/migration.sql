/*
  Warnings:

  - You are about to drop the column `leaderId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `teamCode` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the `TeamMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TournamentJoinRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TournamentParticipant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[profileId,provider]` on the table `SocialLink` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ChatRoomType" AS ENUM ('TEAM', 'TOURNAMENT', 'DIRECT');

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_leaderId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMessage" DROP CONSTRAINT "TeamMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMessage" DROP CONSTRAINT "TeamMessage_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentJoinRequest" DROP CONSTRAINT "TournamentJoinRequest_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentJoinRequest" DROP CONSTRAINT "TournamentJoinRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentParticipant" DROP CONSTRAINT "TournamentParticipant_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentParticipant" DROP CONSTRAINT "TournamentParticipant_userId_fkey";

-- DropIndex
DROP INDEX "SocialLink_profileId_provider_url_key";

-- DropIndex
DROP INDEX "Team_teamCode_key";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "leaderId",
DROP COLUMN "passwordHash",
DROP COLUMN "teamCode";

-- DropTable
DROP TABLE "TeamMessage";

-- DropTable
DROP TABLE "TournamentJoinRequest";

-- DropTable
DROP TABLE "TournamentParticipant";

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" SERIAL NOT NULL,
    "type" "ChatRoomType" NOT NULL,
    "teamId" INTEGER,
    "tournamentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMember" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatMember_roomId_userId_key" ON "ChatMember"("roomId", "userId");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "PlayerGame_gameId_idx" ON "PlayerGame"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLink_profileId_provider_key" ON "SocialLink"("profileId", "provider");

-- CreateIndex
CREATE INDEX "Team_gameId_idx" ON "Team"("gameId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "Tournament_createdBy_idx" ON "Tournament"("createdBy");

-- CreateIndex
CREATE INDEX "TournamentRegistration_tournamentId_idx" ON "TournamentRegistration"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentRegistration_userId_idx" ON "TournamentRegistration"("userId");

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
