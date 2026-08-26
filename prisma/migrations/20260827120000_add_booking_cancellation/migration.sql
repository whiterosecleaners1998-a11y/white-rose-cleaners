-- Cancelling voids a booking without erasing it: the row keeps its booking
-- number so an old receipt still finds it, while dropping out of the orders
-- list and every revenue figure. Postgres 12+ allows ADD VALUE inside the
-- transaction Prisma wraps this in, so long as the value is not used here.
ALTER TYPE "BookingStatus" ADD VALUE 'CANCELLED';

ALTER TABLE "Booking" ADD COLUMN "cancelledAt" TIMESTAMP(3);
