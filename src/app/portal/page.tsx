import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/serialize";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BookingForm from "./booking-form";
import RecentBookings from "./recent-bookings";

export const dynamic = "force-dynamic";

async function getPriceList() {
  const items = await prisma.priceListItem.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return items.map((item) => ({ ...item, price: Number(item.price) }));
}

async function getBundles() {
  const bundles = await prisma.bundle.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      items: { include: { item: true }, orderBy: { item: { sortOrder: "asc" } } },
    },
  });
  return bundles.map((bundle) => ({
    id: bundle.id,
    name: bundle.name,
    shortcut: bundle.shortcut,
    items: bundle.items
      .filter((line) => line.item.active)
      .map((line) => ({
        itemId: line.itemId,
        name: line.item.name,
        price: Number(line.item.price),
        quantity: line.quantity,
      })),
  }));
}

async function getRecentBookings() {
  const bookings = await prisma.booking.findMany({
    // Cancelled orders are void — they belong in a phone search, not on the
    // counter's at-a-glance list.
    where: { status: { not: "CANCELLED" } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    // A window rather than the whole book: enough to page back through a few
    // days at the counter without a round trip, while /orders stays the place
    // to go for the full history.
    take: 50,
  });
  return bookings.map(serializeBooking);
}

export default async function DashboardPage() {
  const [priceList, bundles, recentBookings] = await Promise.all([
    getPriceList(),
    getBundles(),
    getRecentBookings(),
  ]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>New Booking</CardTitle>
          <CardDescription>
            Enter the customer&apos;s clothes and phone number. The total is
            calculated automatically, and you can send the confirmation over
            WhatsApp once the booking is saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {priceList.length === 0 ? (
            <Alert>
              <AlertDescription>
                No price list items yet. Add some in{" "}
                <Link href="/portal/settings/prices" className="underline">
                  Price List
                </Link>{" "}
                first.
              </AlertDescription>
            </Alert>
          ) : (
            <BookingForm
              priceList={priceList}
              bundles={bundles}
              shopName={process.env.SHOP_NAME || "Dry Cleaner"}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentBookings initialBookings={recentBookings} />
        </CardContent>
      </Card>
    </div>
  );
}
