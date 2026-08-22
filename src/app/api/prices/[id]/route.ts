import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  price: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
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

  const item = await prisma.priceListItem.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ ...item, price: Number(item.price) });
}

// Past bookings copy the item name and unit price onto BookingItem, so removing
// a price list row never rewrites history. Removing the row outright (rather
// than flipping `active`) is what frees the unique name to be added again.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removed = await prisma.priceListItem
    .delete({ where: { id } })
    .catch(() => null);

  if (!removed) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
