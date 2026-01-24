-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "tripOptionId" UUID NOT NULL,
    "bookingType" TEXT NOT NULL,
    "componentId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "vendorConfirmation" TEXT,
    "bookingReference" TEXT,
    "pnr" TEXT,
    "paymentIntentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "bookedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "bookingDetails" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "tripOptionId" UUID NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "chargeId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "refundId" TEXT,
    "refundAmount" INTEGER,
    "refundedAt" TIMESTAMP(3),
    "paymentMethodId" TEXT,
    "billingDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_tripOptionId_idx" ON "Booking"("tripOptionId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_bookingType_idx" ON "Booking"("bookingType");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentIntentId_key" ON "Payment"("paymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_tripOptionId_idx" ON "Payment"("tripOptionId");

-- CreateIndex
CREATE INDEX "Payment_paymentIntentId_idx" ON "Payment"("paymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripOptionId_fkey" FOREIGN KEY ("tripOptionId") REFERENCES "TripOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tripOptionId_fkey" FOREIGN KEY ("tripOptionId") REFERENCES "TripOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
