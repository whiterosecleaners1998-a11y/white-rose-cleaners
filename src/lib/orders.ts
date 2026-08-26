import { Prisma } from "@/generated/prisma/client";
import { phoneSearchKey } from "@/lib/phone";

const STATUSES = ["RECEIVED", "READY", "DELIVERED", "CANCELLED"] as const;

export function buildOrdersWhere(
  searchParams: URLSearchParams
): Prisma.BookingWhereInput {
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = searchParams.get("q")?.trim();

  const where: Prisma.BookingWhereInput = {};

  // Cancelled orders are voided, not deleted, so they stay out of the table
  // unless asked for by name. Everything else means "the live order book".
  if (status && (STATUSES as readonly string[]).includes(status)) {
    where.status = status as (typeof STATUSES)[number];
  } else {
    where.status = { not: "CANCELLED" };
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    };
  }

  if (q) {
    const normalizedPhone = phoneSearchKey(q);
    const bookingNumberMatch = q.match(/(\d+)\s*$/);
    const bookingNumber = bookingNumberMatch
      ? Number(bookingNumberMatch[1])
      : null;
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      ...(normalizedPhone ? [{ phone: { contains: normalizedPhone } }] : []),
      ...(bookingNumber !== null && Number.isInteger(bookingNumber)
        ? [{ bookingNumber }]
        : []),
    ];
  }

  return where;
}
