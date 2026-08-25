import type { Booking, BookingItem } from "@/generated/prisma/client";
import { formatBookingNumber } from "@/lib/booking-number";
import { balanceOf } from "@/lib/money";

export function serializeBooking(
  booking: Booking & { items: BookingItem[] }
) {
  return {
    ...booking,
    bookingCode: formatBookingNumber(booking.bookingNumber),
    totalAmount: Number(booking.totalAmount),
    paidAmount: Number(booking.paidAmount),
    remainingAmount: balanceOf(
      Number(booking.totalAmount),
      Number(booking.paidAmount)
    ),
    items: booking.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };
}
