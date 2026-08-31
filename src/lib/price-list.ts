import { prisma } from "@/lib/prisma";

/**
 * The shop's price list, read for the public website.
 *
 * The counter edits one list in Settings → Price List and every customer-facing
 * page reads it from here: the printed list, the bill calculator, the totals on
 * a pickup request. There is no second copy to fall out of step.
 */

export type PriceItem = {
  id: string;
  name: string;
  price: number;
};

export type PriceBundle = {
  id: string;
  name: string;
  parts: { name: string; quantity: number }[];
  total: number;
};

export async function getPriceList(): Promise<PriceItem[]> {
  const items = await prisma.priceListItem.findMany({
    where: { active: true },
    // The shop's own ordering, which already groups the list the way the
    // counter thinks about it — menswear, then womenswear, then household.
    // Worth honouring rather than re-sorting or guessing at categories.
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
  }));
}

export async function getBundles(): Promise<PriceBundle[]> {
  const bundles = await prisma.bundle.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      items: {
        include: { item: true },
        orderBy: { item: { sortOrder: "asc" } },
      },
    },
  });

  return bundles.map((bundle) => ({
    id: bundle.id,
    name: bundle.name,
    parts: bundle.items.map((line) => ({
      name: line.item.name,
      quantity: line.quantity,
    })),
    total: bundle.items.reduce(
      (sum, line) => sum + Number(line.item.price) * line.quantity,
      0
    ),
  }));
}
