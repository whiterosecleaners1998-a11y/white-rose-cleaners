-- Money taken so far on a booking. What is still owed is derived as
-- totalAmount - paidAmount rather than stored, so the two cannot disagree.
ALTER TABLE "Booking" ADD COLUMN "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Orders taken before payment tracking existed were settled in cash off the
-- books. Defaulting them to zero would open the shop with a debt of its entire
-- history, so they are recorded as paid; balance tracking starts from here.
UPDATE "Booking" SET "paidAmount" = "totalAmount";
