-- CreateEnum
CREATE TYPE "BudgetCategory" AS ENUM ('FLIGHT', 'HOTEL', 'ACTIVITY', 'FOOD', 'TRANSPORT', 'CONTINGENCY');

-- AlterTable: Add new columns to BudgetConfig with temporary defaults
ALTER TABLE "BudgetConfig"
ADD COLUMN "activityPct" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
ADD COLUMN "foodPct" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
ADD COLUMN "transportPct" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
ADD COLUMN "contingencyPct" DOUBLE PRECISION NOT NULL DEFAULT 0.10;

-- Update existing rows with reasonable defaults based on travel style
-- BUDGET style: More conservative, larger buffer
UPDATE "BudgetConfig"
SET
  "activityPct" = 0.10,
  "foodPct" = 0.08,
  "transportPct" = 0.04,
  "contingencyPct" = "bufferPct"  -- Use existing buffer as contingency
WHERE "travelStyle" = 'BUDGET';

-- BALANCED style: More on experiences, smaller buffer
UPDATE "BudgetConfig"
SET
  "activityPct" = 0.15,
  "foodPct" = 0.12,
  "transportPct" = 0.06,
  "contingencyPct" = "bufferPct"  -- Use existing buffer as contingency
WHERE "travelStyle" = 'BALANCED';

-- Adjust flight and hotel percentages to maintain 100% total
-- BUDGET: flight 35%, hotel 40% becomes flight 30%, hotel 38%
UPDATE "BudgetConfig"
SET
  "flightPct" = 0.30,
  "hotelPct" = 0.38
WHERE "travelStyle" = 'BUDGET';

-- BALANCED: flight 40%, hotel 45% becomes flight 28%, hotel 35%
UPDATE "BudgetConfig"
SET
  "flightPct" = 0.28,
  "hotelPct" = 0.35,
  "activityPct" = 0.15,
  "foodPct" = 0.12,
  "transportPct" = 0.05,
  "contingencyPct" = 0.05
WHERE "travelStyle" = 'BALANCED';

-- Drop the old bufferPct column
ALTER TABLE "BudgetConfig" DROP COLUMN "bufferPct";

-- AlterTable: Add new fields to TripRequest
ALTER TABLE "TripRequest" ADD COLUMN "priorities" JSONB;
ALTER TABLE "TripRequest" ADD COLUMN "constraints" JSONB;

-- CreateTable: BudgetAllocation
CREATE TABLE "BudgetAllocation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tripRequestId" UUID NOT NULL,
    "category" "BudgetCategory" NOT NULL,
    "allocated" INTEGER NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetAllocation_tripRequestId_idx" ON "BudgetAllocation"("tripRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_tripRequestId_category_key" ON "BudgetAllocation"("tripRequestId", "category");

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
