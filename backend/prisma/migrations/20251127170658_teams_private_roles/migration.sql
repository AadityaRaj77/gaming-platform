/*
  Warnings:

  - You are about to drop the column `captainId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `roleInTeam` on the `TeamMember` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[teamCode]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,userId]` on the table `TeamJoinRequest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `leaderId` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamCode` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('LEADER', 'MEMBER', 'MODERATOR');

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_captainId_fkey";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "captainId",
ADD COLUMN     "leaderId" INTEGER NOT NULL,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "teamCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "roleInTeam",
ADD COLUMN     "role" "TeamRole" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE UNIQUE INDEX "Team_teamCode_key" ON "Team"("teamCode");

-- CreateIndex
CREATE UNIQUE INDEX "TeamJoinRequest_teamId_userId_key" ON "TeamJoinRequest"("teamId", "userId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
