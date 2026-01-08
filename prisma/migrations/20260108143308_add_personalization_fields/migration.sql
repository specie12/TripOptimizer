-- AlterTable
ALTER TABLE "User" ADD COLUMN     "inferredPreferences" JSONB,
ADD COLUMN     "totalInteractions" INTEGER NOT NULL DEFAULT 0;
