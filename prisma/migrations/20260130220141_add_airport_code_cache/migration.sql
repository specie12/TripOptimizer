-- CreateTable
CREATE TABLE "AirportCode" (
    "id" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "iataCode" TEXT NOT NULL,
    "airportName" TEXT,
    "country" TEXT,
    "resolvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirportCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AirportCode_cityName_key" ON "AirportCode"("cityName");

-- CreateIndex
CREATE INDEX "AirportCode_cityName_idx" ON "AirportCode"("cityName");

-- CreateIndex
CREATE INDEX "AirportCode_iataCode_idx" ON "AirportCode"("iataCode");
