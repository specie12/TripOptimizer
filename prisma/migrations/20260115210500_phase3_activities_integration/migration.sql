-- CreateEnum: ActivityCategory for Phase 3
CREATE TYPE "ActivityCategory" AS ENUM ('TOUR', 'ATTRACTION', 'EXPERIENCE', 'ADVENTURE', 'ENTERTAINMENT', 'TRANSPORT');

-- CreateTable: ActivityOption for Phase 3
CREATE TABLE "ActivityOption" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tripOptionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "deepLink" TEXT NOT NULL,
    "imageUrl" TEXT,
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "lockStatus" "LockStatus" NOT NULL DEFAULT 'UNLOCKED',
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityOption_tripOptionId_idx" ON "ActivityOption"("tripOptionId");

-- CreateIndex
CREATE INDEX "ActivityOption_category_idx" ON "ActivityOption"("category");

-- CreateIndex
CREATE INDEX "ActivityOption_lockStatus_idx" ON "ActivityOption"("lockStatus");

-- AddForeignKey
ALTER TABLE "ActivityOption" ADD CONSTRAINT "ActivityOption_tripOptionId_fkey" FOREIGN KEY ("tripOptionId") REFERENCES "TripOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
