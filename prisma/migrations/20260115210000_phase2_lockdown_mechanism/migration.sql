-- CreateEnum: LockStatus for Phase 2 lock-down mechanism
CREATE TYPE "LockStatus" AS ENUM ('UNLOCKED', 'LOCKED', 'CONFIRMED');

-- AlterTable: Add lock-down fields to TripOption
ALTER TABLE "TripOption"
ADD COLUMN "lockStatus" "LockStatus" NOT NULL DEFAULT 'UNLOCKED',
ADD COLUMN "lockedAt" TIMESTAMP(3);

-- AlterTable: Add lock-down fields to FlightOption
ALTER TABLE "FlightOption"
ADD COLUMN "lockStatus" "LockStatus" NOT NULL DEFAULT 'UNLOCKED',
ADD COLUMN "lockedAt" TIMESTAMP(3);

-- AlterTable: Add lock-down fields to HotelOption
ALTER TABLE "HotelOption"
ADD COLUMN "lockStatus" "LockStatus" NOT NULL DEFAULT 'UNLOCKED',
ADD COLUMN "lockedAt" TIMESTAMP(3);

-- CreateIndex: Add index on lockStatus for efficient queries
CREATE INDEX "TripOption_lockStatus_idx" ON "TripOption"("lockStatus");
CREATE INDEX "FlightOption_lockStatus_idx" ON "FlightOption"("lockStatus");
CREATE INDEX "HotelOption_lockStatus_idx" ON "HotelOption"("lockStatus");
