import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/serialize";
import { formatBookingNumber } from "@/lib/booking-number";
import { statusLabel } from "@/lib/status";
import { buildOrdersWhere } from "@/lib/orders";

const EXPORT_LIMIT = 50000;

export async function GET(request: NextRequest) {
  const where = buildOrdersWhere(request.nextUrl.searchParams);

  const bookings = await prisma.booking.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const rows = bookings.map(serializeBooking).map((b) => ({
    "Booking #": b.bookingCode,
    Customer: b.customerName,
    Phone: b.phone,
    Status: statusLabel[b.status] ?? b.status,
    "Total Amount": b.totalAmount,
    Paid: b.paidAmount,
    Balance: b.remainingAmount,
    Items: b.items
      .map((item) => `${item.itemName} x${item.quantity}`)
      .join(", "),
    "Received At": new Date(b.createdAt).toLocaleString(),
    "Ready At": b.readyAt ? new Date(b.readyAt).toLocaleString() : "",
    "Delivered At": b.deliveredAt
      ? new Date(b.deliveredAt).toLocaleString()
      : "",
    Notes: b.notes ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 40 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="orders-${today}.xlsx"`,
    },
  });
}
