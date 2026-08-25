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
    status: z.enum(["RECEIVED", "READY", "DELIVERED"]),
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
    status?: "RECEIVED" | "READY" | "DELIVERED";
    readyAt?: Date;
    deliveredAt?: Date;
    paidAmount?: number;
  } = {};

  if (parsed.data.status) {
    data.status = parsed.data.status;
    if (parsed.data.status === "READY" && !existing.readyAt) data.readyAt = now;
    if (parsed.data.status === "DELIVERED" && !existing.deliveredAt)
      data.deliveredAt = now;
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
