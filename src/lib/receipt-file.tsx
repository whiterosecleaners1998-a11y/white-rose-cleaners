/**
 * Renders a booking's receipt PDF. Shared by the staff-facing download route
 * and the public signed-link route so the two cannot produce different papers.
 */
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/serialize";
import { ReceiptDocument } from "@/lib/receipt-pdf";

/** Returns null when no booking has that id, so callers can 404. */
export async function renderReceiptPdf(
  id: string
): Promise<{ buffer: Buffer; bookingCode: string } | null> {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!booking) return null;

  const b = serializeBooking(booking);
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";
  const buffer = await renderToBuffer(
    <ReceiptDocument booking={b} shopName={shopName} />
  );

  return { buffer, bookingCode: b.bookingCode };
}
