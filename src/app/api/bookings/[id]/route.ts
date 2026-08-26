import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/serialize";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(serializeBooking(booking));
}

// Both fields are optional so the status control and the payment box can each
// PATCH just their own field, but a body carrying neither is a mistake.
const updateSchema = z
  .object({
    status: z.enum(["RECEIVED", "READY", "DELIVERED", "CANCELLED"]),
    paidAmount: z.number().nonnegative(),
  })
  .partial()
  .refine((body) => body.status !== undefined || body.paidAmount !== undefined, {
    message: "Nothing to update",
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const data: {
    status?: "RECEIVED" | "READY" | "DELIVERED" | "CANCELLED";
    readyAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date | null;
    paidAmount?: number;
  } = {};

  if (parsed.data.status) {
    data.status = parsed.data.status;
    if (parsed.data.status === "READY" && !existing.readyAt) data.readyAt = now;
    if (parsed.data.status === "DELIVERED" && !existing.deliveredAt)
      data.deliveredAt = now;
    // Stamped on the way in and cleared on the way out, so an un-cancelled
    // booking carries no trace of having been voided.
    if (parsed.data.status === "CANCELLED") data.cancelledAt = now;
    else if (existing.cancelledAt) data.cancelledAt = null;
  }

  if (parsed.data.paidAmount !== undefined) {
    // Capped at the order total for the same reason as on create.
    data.paidAmount = Math.min(
      parsed.data.paidAmount,
      Number(existing.totalAmount)
    );
  }

  const booking = await prisma.booking.update({
    where: { id },
    data,
    include: { items: true },
  });

  return NextResponse.json(serializeBooking(booking));
}

/**
 * Erases a booking outright — its items go with it through the schema's
 * cascade, and its booking number is never reissued, leaving a gap in the
 * sequence. Meant for bookings that should never have existed: duplicates,
 * test entries, a wrong customer. To void a real order while keeping the
 * record, PATCH it to CANCELLED instead.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await prisma.booking
    .delete({ where: { id }, select: { bookingNumber: true } })
    .catch(() => null);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, bookingNumber: deleted.bookingNumber });
}
