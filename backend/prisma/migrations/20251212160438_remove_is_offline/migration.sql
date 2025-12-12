-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "isOffline" DROP NOT NULL,
ALTER COLUMN "isOffline" SET DEFAULT false;
