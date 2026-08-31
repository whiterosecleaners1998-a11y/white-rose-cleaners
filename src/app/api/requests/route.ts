import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { toInternationalPhone } from "@/lib/phone";

/**
 * Where the public website's forms land. This is the one endpoint under /api
 * that answers without a session (see proxy.ts) — a customer asking for a
 * pickup has no login and never will.
 *
 * It only ever writes. Nothing here reads a request back out: the counter sees
 * them on /portal/requests, behind the shop password, because a request holds
 * someone's name, phone and home address.
 */

const itemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive().max(999),
});

const createSchema = z.object({
  kind: z.enum(["PICKUP", "PACKAGE"]).default("PICKUP"),
  customerName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional(),
  // Sent as yyyy-mm-dd by the date input; the time of day is meaningless here,
  // the slot below is what the shop actually agrees to.
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  timeSlot: z.string().trim().max(60).optional(),
  serviceType: z.string().trim().max(80).optional(),
  packageName: z.string().trim().max(80).optional(),
  note: z.string().trim().max(1000).optional(),
  items: z.array(itemSchema).max(200).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const items = data.items ?? [];

  // Totalled here rather than trusted from the browser: the basket arrives
  // from a page anyone can edit, and this figure is what the counter reads.
  const estimateTotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const created = await prisma.serviceRequest.create({
    data: {
      kind: data.kind,
      customerName: data.customerName,
      phone: toInternationalPhone(data.phone),
      email: data.email || null,
      address: data.address || null,
      preferredDate: data.preferredDate
        ? new Date(`${data.preferredDate}T00:00:00`)
        : null,
      timeSlot: data.timeSlot || null,
      serviceType: data.serviceType || null,
      packageName: data.packageName || null,
      note: data.note || null,
      estimateTotal: items.length > 0 ? estimateTotal : null,
      items: {
        create: items.map((item) => ({
          itemName: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      },
    },
  });

  // Only the id goes back. The customer already knows what they typed, and
  // echoing the stored row would hand anyone who can POST a way to read it.
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
