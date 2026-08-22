import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// A bundle is stored as a name plus the price list lines it expands to, so the
// booking form can drop every line into the cart in one press.
const bundleInclude = {
  items: {
    include: { item: true },
    orderBy: { item: { sortOrder: "asc" } },
  },
} as const;

type BundleWithItems = Awaited<
  ReturnType<typeof prisma.bundle.findMany<{ include: typeof bundleInclude }>>
>[number];

export function serializeBundle(bundle: BundleWithItems) {
  return {
    id: bundle.id,
    name: bundle.name,
    sortOrder: bundle.sortOrder,
    items: bundle.items.map((line) => ({
      itemId: line.itemId,
      name: line.item.name,
      price: Number(line.item.price),
      quantity: line.quantity,
    })),
  };
}

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
