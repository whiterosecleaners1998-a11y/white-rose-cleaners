import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { originFromHeaders } from "@/lib/origin";
import { buildReceiptUrl } from "@/lib/receipt-link";
import { serializeBooking } from "@/lib/serialize";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BookingActions from "./booking-actions";
import ReceiptSheet from "./receipt-sheet";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!booking) notFound();

  const b = serializeBooking(booking);
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";
  // Built here rather than in BookingActions: signing needs SESSION_SECRET,
  // which must not cross into a client component.
  const receiptUrl = buildReceiptUrl(originFromHeaders(await headers()), b.id);

  return (
    <>
      <div className="space-y-4 print-hide-when-receipt">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <BookingActions
        id={b.id}
        status={b.status}
        customerName={b.customerName}
        phone={b.phone}
        bookingCode={b.bookingCode}
        totalAmount={b.totalAmount}
        paidAmount={b.paidAmount}
        shopName={shopName}
        receiptUrl={receiptUrl}
      />

      <Card className="print:rounded-none print:p-0 print:ring-0">
        <CardHeader className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-xl font-semibold text-primary">
              {shopName}
            </h1>
            <p className="text-xs text-muted-foreground">
              Receipt #{b.bookingCode}
            </p>
          </div>
          <Badge className={statusBadgeClass[b.status]}>
            {statusLabel[b.status]}
          </Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Customer</dt>
              <dd className="font-medium">{b.customerName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{b.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Received</dt>
              <dd className="font-medium">
                {new Date(b.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Booking #</dt>
              <dd className="font-mono text-xs font-medium">
                {b.bookingCode}
              </dd>
            </div>
          </dl>

          <Separator className="my-4" />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {b.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.itemName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.lineTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-col items-end gap-1">
            <p className="text-base font-semibold">
              Total: {b.totalAmount.toFixed(2)}
            </p>
            {b.paidAmount > 0 && (
              <p className="text-sm text-muted-foreground tabular-nums">
                Paid: {b.paidAmount.toFixed(2)}
              </p>
            )}
            <p
              className={
                b.remainingAmount > 0
                  ? "text-sm font-medium tabular-nums text-amber-700 dark:text-amber-400"
                  : "text-sm font-medium tabular-nums text-green-700 dark:text-green-400"
              }
            >
              {b.remainingAmount > 0
                ? `Balance: ${b.remainingAmount.toFixed(2)}`
                : "Paid in full"}
            </p>
          </div>

          {b.notes && (
            <p className="mt-4 text-sm text-muted-foreground">
              Notes: {b.notes}
            </p>
          )}
        </CardContent>
      </Card>
      </div>

      <ReceiptSheet booking={b} shopName={shopName} />
    </>
  );
}
