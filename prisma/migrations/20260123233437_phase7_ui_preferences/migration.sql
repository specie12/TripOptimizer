-- CreateEnum
CREATE TYPE "TripPace" AS ENUM ('RELAXED', 'BALANCED', 'PACKED');

-- CreateEnum
CREATE TYPE "AccommodationType" AS ENUM ('HOTELS', 'AIRBNB', 'RESORTS', 'HOSTELS');

-- CreateEnum
CREATE TYPE "InterestCategory" AS ENUM ('CULTURE_HISTORY', 'FOOD_DINING', 'ADVENTURE', 'BEACH_RELAXATION', 'NIGHTLIFE', 'NATURE_WILDLIFE', 'SHOPPING', 'ART_MUSEUMS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TravelStyle" ADD VALUE 'MID_RANGE';
ALTER TYPE "TravelStyle" ADD VALUE 'LUXURY';

-- AlterTable
ALTER TABLE "TripRequest" ADD COLUMN     "accommodationType" "AccommodationType",
ADD COLUMN     "interests" "InterestCategory"[],
ADD COLUMN     "tripPace" "TripPace",
ALTER COLUMN "travelStyle" SET DEFAULT 'BALANCED';
