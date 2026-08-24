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

const updateSchema = z.object({
  status: z.enum(["RECEIVED", "READY", "DELIVERED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const data: {
    status: "RECEIVED" | "READY" | "DELIVERED";
    readyAt?: Date;
    deliveredAt?: Date;
  } = { status: parsed.data.status };
  if (parsed.data.status === "READY" && !existing.readyAt) data.readyAt = now;
  if (parsed.data.status === "DELIVERED" && !existing.deliveredAt)
    data.deliveredAt = now;

  const booking = await prisma.booking.update({
    where: { id },
    data,
    include: { items: true },
  });

  return NextResponse.json(serializeBooking(booking));
}
