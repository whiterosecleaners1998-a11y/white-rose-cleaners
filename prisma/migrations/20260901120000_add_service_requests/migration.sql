-- What a customer asks for on the public website, before anything has changed
-- hands. Kept apart from Booking: nothing has been counted and nothing is owed
-- yet, and a request may never become an order at all.

CREATE TYPE "RequestKind" AS ENUM ('PICKUP', 'PACKAGE');

CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "kind" "RequestKind" NOT NULL DEFAULT 'PICKUP',
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "preferredDate" TIMESTAMP(3),
    "timeSlot" TEXT,
    "serviceType" TEXT,
    "packageName" TEXT,
    "note" TEXT,
    "estimateTotal" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- A snapshot of the basket the customer built in the bill calculator. Copied
-- rather than referenced, so a later price change never rewrites what someone
-- was quoted.
CREATE TABLE "ServiceRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ServiceRequestItem_pkey" PRIMARY KEY ("id")
);

-- The counter's screen reads new requests first, oldest at the bottom.
CREATE INDEX "ServiceRequest_status_createdAt_idx" ON "ServiceRequest"("status", "createdAt");

CREATE INDEX "ServiceRequest_phone_idx" ON "ServiceRequest"("phone");

ALTER TABLE "ServiceRequestItem" ADD CONSTRAINT "ServiceRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
