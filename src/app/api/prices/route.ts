import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.priceListItem.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(
    items.map((item) => ({ ...item, price: Number(item.price) }))
  );
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  price: z.number().nonnegative(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  const { name, price } = parsed.data;

  // `name` is unique. Rows removed before this endpoint stopped soft-deleting
  // were only flipped to inactive, so an old row can still be holding the name —
  // reuse it rather than failing the insert with a constraint error.
  const existing = await prisma.priceListItem.findUnique({ where: { name } });
  if (existing?.active) {
    return NextResponse.json(
      { error: `"${name}" is already on the price list.` },
      { status: 409 }
    );
  }

  const count = await prisma.priceListItem.count({ where: { active: true } });
  const item = existing
    ? await prisma.priceListItem.update({
        where: { id: existing.id },
        data: { price, active: true, sortOrder: count },
      })
    : await prisma.priceListItem.create({
        data: { name, price, sortOrder: count },
      });

  return NextResponse.json({ ...item, price: Number(item.price) }, { status: 201 });
}

// Clear the list so a fresh one can be entered. Past bookings keep their own
// copy of every line, so nothing already booked is affected.
export async function DELETE() {
  const result = await prisma.priceListItem.deleteMany({});
  return NextResponse.json({ ok: true, removed: result.count });
}
