import Link from "next/link";
import {
  CircleCheck,
  Clock,
  Download,
  Package,
  Receipt,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/serialize";
import { buildOrdersWhere } from "@/lib/orders";
import { getOrderStats } from "@/lib/order-stats";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import StatCard from "@/components/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OrdersFilters from "./orders-filters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

/** Page numbers around the current one, with gaps collapsed to an ellipsis. */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages = new Set([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);

  const out: (number | "gap")[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) out.push("gap");
    out.push(p);
    previous = p;
  }
  return out;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string") params.set(key, value);
  }

  const page = Math.max(1, Number(params.get("page")) || 1);
  const where = buildOrdersWhere(params);

  const [bookings, total, stats] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
    getOrderStats(),
  ]);

  const orders = bookings.map(serializeBooking);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(page * PAGE_SIZE, total);

  function pageHref(p: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    return `/orders?${next.toString()}`;
  }

  const exportParams = new URLSearchParams(params);
  exportParams.delete("page");

  return (
    <div>
      <PageHeader
        breadcrumb={["Bookings", "Orders"]}
        title="Orders"
        actions={
          <Button
            variant="outline"
            size="sm"
            render={
              <a href={`/api/orders/export?${exportParams.toString()}`} />
            }
          >
            <Download className="size-3.5" />
            Export
          </Button>
        }
      />

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-medium">Quick Stats</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard
            icon={Receipt}
            label="Total Orders"
            value={stats.total.toLocaleString()}
          />
          <StatCard
            icon={Clock}
            label="In Cleaning"
            value={String(stats.received)}
            note={stats.received > 0 ? "awaiting" : "all clear"}
            tone={stats.received > 0 ? "warning" : "positive"}
          />
          <StatCard
            icon={Package}
            label="Ready"
            value={String(stats.ready)}
            note={stats.ready > 0 ? "for pickup" : undefined}
            tone="neutral"
          />
          <StatCard
            icon={CircleCheck}
            label="Delivered Today"
            value={String(stats.deliveredToday)}
            tone="positive"
          />
          <StatCard
            icon={Wallet}
            label="Revenue Today"
            value={stats.revenueToday.toFixed(0)}
          />
          <StatCard
            icon={Receipt}
            label="Avg Order Value"
            value={stats.averageOrderValue.toFixed(0)}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <OrdersFilters />
        </div>

        {orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No orders match these filters.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Phone
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <Link
                          href={`/bookings/${b.id}`}
                          className="font-mono text-xs font-medium hover:underline"
                        >
                          {b.bookingCode}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        {b.customerName}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {b.phone}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {b.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass[b.status]}>
                          {statusLabel[b.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
              <p className="text-xs text-muted-foreground">
                Showing {firstRow.toLocaleString()}&ndash;
                {lastRow.toLocaleString()} of {total.toLocaleString()} order
                {total === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  render={page > 1 ? <Link href={pageHref(page - 1)} /> : undefined}
                >
                  Previous
                </Button>
                {pageWindow(page, pageCount).map((entry, i) =>
                  entry === "gap" ? (
                    <span
                      key={`gap-${i}`}
                      className="px-1 text-xs text-muted-foreground"
                    >
                      &hellip;
                    </span>
                  ) : (
                    <Button
                      key={entry}
                      variant={entry === page ? "default" : "ghost"}
                      size="sm"
                      className="min-w-8 px-2 tabular-nums"
                      render={
                        entry === page ? undefined : (
                          <Link href={pageHref(entry)} />
                        )
                      }
                    >
                      {entry}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount}
                  render={
                    page < pageCount ? <Link href={pageHref(page + 1)} /> : undefined
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
