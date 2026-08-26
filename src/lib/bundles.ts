import { prisma } from "@/lib/prisma";

// A bundle is stored as a name plus the price list lines it expands to, so the
// booking form can drop every line into the cart in one press.
export const bundleInclude = {
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
    shortcut: bundle.shortcut,
    items: bundle.items.map((line) => ({
      itemId: line.itemId,
      name: line.item.name,
      price: Number(line.item.price),
      quantity: line.quantity,
    })),
  };
}
