-- CreateEnum
CREATE TYPE "TravelStyle" AS ENUM ('BUDGET', 'BALANCED');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW_TRIP_OPTION', 'EXPAND_EXPLANATION', 'CLICK_BOOK_FLIGHT', 'CLICK_BOOK_HOTEL', 'CHANGE_HOTEL');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "inferredBudgetBand" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripRequest" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "originCity" TEXT NOT NULL,
    "destination" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "numberOfDays" INTEGER NOT NULL,
    "budgetTotal" INTEGER NOT NULL,
    "travelStyle" "TravelStyle" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripOption" (
    "id" UUID NOT NULL,
    "tripRequestId" UUID NOT NULL,
    "destination" TEXT NOT NULL,
    "totalCost" INTEGER NOT NULL,
    "remainingBudget" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT NOT NULL,
    "itineraryJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightOption" (
    "id" UUID NOT NULL,
    "tripOptionId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "returnTime" TIMESTAMP(3) NOT NULL,
    "deepLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlightOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelOption" (
    "id" UUID NOT NULL,
    "tripOptionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priceTotal" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION,
    "deepLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HotelOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionEvent" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "tripOptionId" UUID,
    "eventType" "InteractionType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetConfig" (
    "id" UUID NOT NULL,
    "travelStyle" "TravelStyle" NOT NULL,
    "flightPct" DOUBLE PRECISION NOT NULL,
    "hotelPct" DOUBLE PRECISION NOT NULL,
    "bufferPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripRequest_userId_idx" ON "TripRequest"("userId");

-- CreateIndex
CREATE INDEX "TripOption_tripRequestId_idx" ON "TripOption"("tripRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "FlightOption_tripOptionId_key" ON "FlightOption"("tripOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelOption_tripOptionId_key" ON "HotelOption"("tripOptionId");

-- CreateIndex
CREATE INDEX "InteractionEvent_userId_idx" ON "InteractionEvent"("userId");

-- CreateIndex
CREATE INDEX "InteractionEvent_tripOptionId_idx" ON "InteractionEvent"("tripOptionId");

-- CreateIndex
CREATE INDEX "InteractionEvent_eventType_idx" ON "InteractionEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetConfig_travelStyle_key" ON "BudgetConfig"("travelStyle");

-- AddForeignKey
ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripOption" ADD CONSTRAINT "TripOption_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightOption" ADD CONSTRAINT "FlightOption_tripOptionId_fkey" FOREIGN KEY ("tripOptionId") REFERENCES "TripOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelOption" ADD CONSTRAINT "HotelOption_tripOptionId_fkey" FOREIGN KEY ("tripOptionId") REFERENCES "TripOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionEvent" ADD CONSTRAINT "InteractionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionEvent" ADD CONSTRAINT "InteractionEvent_tripOptionId_fkey" FOREIGN KEY ("tripOptionId") REFERENCES "TripOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
