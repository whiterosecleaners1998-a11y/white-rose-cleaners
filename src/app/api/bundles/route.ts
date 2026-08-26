import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeShortcut } from "@/lib/shortcuts";
import { bundleInclude, serializeBundle } from "@/lib/bundles";

export async function GET() {
  const bundles = await prisma.bundle.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: bundleInclude,
  });
  return NextResponse.json(bundles.map(serializeBundle));
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  // Optional: a blank one means "hand it a spare letter".
  shortcut: z.string().trim().max(1).optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.number().int().positive().max(999),
      })
    )
    .min(1, "A bundle needs at least one item."),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid bundle" },
      { status: 400 }
    );
  }

  const { name, items } = parsed.data;
  const shortcut = normalizeShortcut(parsed.data.shortcut);
  if (parsed.data.shortcut && !shortcut) {
    return NextResponse.json(
      { error: "A shortcut has to be a single letter." },
      { status: 400 }
    );
  }

  // Reject unknown or removed items up front rather than letting the foreign
  // key fail with an opaque 500.
  const known = await prisma.priceListItem.findMany({
    where: { id: { in: items.map((line) => line.itemId) }, active: true },
    select: { id: true },
  });
  if (known.length !== items.length) {
    return NextResponse.json(
      { error: "One of those items is no longer on the price list." },
      { status: 400 }
    );
  }

  if (shortcut) {
    const clash = await prisma.bundle.findFirst({
      where: { active: true, shortcut, name: { not: name } },
      select: { name: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: `"${clash.name}" already uses ${shortcut.toUpperCase()}.` },
        { status: 409 }
      );
    }
  }

  const existing = await prisma.bundle.findUnique({ where: { name } });
  if (existing?.active) {
    return NextResponse.json(
      { error: `A bundle named "${name}" already exists.` },
      { status: 409 }
    );
  }

  const count = await prisma.bundle.count({ where: { active: true } });
  const data = {
    name,
    active: true,
    sortOrder: count,
    shortcut,
    items: {
      create: items.map((line) => ({
        itemId: line.itemId,
        quantity: line.quantity,
      })),
    },
  };

  // A bundle removed earlier keeps its row (and its unique name), so reuse it
  // instead of failing the insert.
  const bundle = existing
    ? await prisma.bundle.update({
        where: { id: existing.id },
        data: { ...data, items: { deleteMany: {}, ...data.items } },
        include: bundleInclude,
      })
    : await prisma.bundle.create({ data, include: bundleInclude });

  return NextResponse.json(serializeBundle(bundle), { status: 201 });
}
