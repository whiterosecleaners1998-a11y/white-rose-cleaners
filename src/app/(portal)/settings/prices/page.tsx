import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PriceListEditor from "./price-list-editor";
import BundleEditor from "./bundle-editor";

export const dynamic = "force-dynamic";

export default async function PricesPage() {
  const [items, bundles] = await Promise.all([
    prisma.priceListItem.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.bundle.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        items: {
          include: { item: true },
          orderBy: { item: { sortOrder: "asc" } },
        },
      },
    }),
  ]);

  const priceItems = items.map((item) => ({
    ...item,
    price: Number(item.price),
  }));

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Price List</CardTitle>
          <CardDescription>
            These items and prices appear when creating a new booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PriceListEditor initialItems={priceItems} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bundles</CardTitle>
          <CardDescription>
            Group items you always book together. A bundle shows up as a single
            button on the booking form that adds every line at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BundleEditor
            items={priceItems}
            initialBundles={bundles.map((bundle) => ({
              id: bundle.id,
              name: bundle.name,
              items: bundle.items
                .filter((line) => line.item.active)
                .map((line) => ({
                  itemId: line.itemId,
                  name: line.item.name,
                  price: Number(line.item.price),
                  quantity: line.quantity,
                })),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
