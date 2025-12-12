/*
  Warnings:

  - The values [RUNNING] on the enum `TournamentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isOffline` on the `Tournament` table. All the data in the column will be lost.
  - Added the required column `feeType` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venueType` to the `Tournament` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('FREE', 'PAID');

-- AlterEnum
BEGIN;
CREATE TYPE "TournamentStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Tournament" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tournament" ALTER COLUMN "status" TYPE "TournamentStatus_new" USING ("status"::text::"TournamentStatus_new");
ALTER TYPE "TournamentStatus" RENAME TO "TournamentStatus_old";
ALTER TYPE "TournamentStatus_new" RENAME TO "TournamentStatus";
DROP TYPE "public"."TournamentStatus_old";
ALTER TABLE "Tournament" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';
COMMIT;

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "isOffline",
ADD COLUMN     "feeAmount" INTEGER,
ADD COLUMN     "feeType" "FeeType" NOT NULL,
ADD COLUMN     "venueType" "VenueType" NOT NULL;
