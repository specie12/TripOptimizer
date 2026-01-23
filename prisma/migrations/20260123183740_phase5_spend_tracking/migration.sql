-- AlterTable
ALTER TABLE "ActivityOption" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BudgetAllocation" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BudgetConfig" ALTER COLUMN "activityPct" DROP DEFAULT,
ALTER COLUMN "foodPct" DROP DEFAULT,
ALTER COLUMN "transportPct" DROP DEFAULT,
ALTER COLUMN "contingencyPct" DROP DEFAULT;

-- CreateTable
CREATE TABLE "SpendRecord" (
    "id" UUID NOT NULL,
    "tripRequestId" UUID NOT NULL,
    "category" "BudgetCategory" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpendRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpendRecord_tripRequestId_idx" ON "SpendRecord"("tripRequestId");

-- CreateIndex
CREATE INDEX "SpendRecord_category_idx" ON "SpendRecord"("category");

-- CreateIndex
CREATE INDEX "SpendRecord_recordedAt_idx" ON "SpendRecord"("recordedAt");

-- AddForeignKey
ALTER TABLE "SpendRecord" ADD CONSTRAINT "SpendRecord_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
