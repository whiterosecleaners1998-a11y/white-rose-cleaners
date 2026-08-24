import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { serializeBooking } from "@/lib/serialize";

export async function GET(request: NextRequest) {
  const phoneParam = request.nextUrl.searchParams.get("phone");
  const q = request.nextUrl.searchParams.get("q")?.trim();

  let where;
  if (phoneParam) {
    const normalized = normalizePhone(phoneParam);
    where = normalized ? { phone: { contains: normalized } } : { id: "" };
  } else if (q) {
    const normalizedPhone = normalizePhone(q);
    const bookingNumber = bookingNumberFromQuery(q);
    where = {
      OR: [
        { customerName: { contains: q, mode: "insensitive" as const } },
        ...(normalizedPhone ? [{ phone: { contains: normalizedPhone } }] : []),
        ...(bookingNumber !== null ? [{ bookingNumber }] : []),
      ],
    };
  } else {
    where = undefined;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: phoneParam || q ? undefined : 15,
  });

  return NextResponse.json(bookings.map(serializeBooking));
}

function bookingNumberFromQuery(q: string): number | null {
  const match = q.match(/(\d+)\s*$/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const createSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(5).max(30),
  notes: z.string().trim().max(1000).optional(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        unitPrice: z.number().nonnegative(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customerName, phone, notes, items } = parsed.data;
  const phoneNormalized = normalizePhone(phone);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const booking = await prisma.booking.create({
    data: {
      customerName,
      phone: phoneNormalized,
      notes,
      totalAmount,
      items: {
        create: items.map((item) => ({
          itemName: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.unitPrice * item.quantity,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(serializeBooking(booking), { status: 201 });
}
