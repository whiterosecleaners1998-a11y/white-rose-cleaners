import { prisma } from "@/lib/prisma";
import { balanceOf } from "@/lib/money";

export type OrderStats = {
  total: number;
  received: number;
  ready: number;
  deliveredToday: number;
  revenueToday: number;
  averageOrderValue: number;
  outstanding: number;
};

// A cancelled booking is void: it counts for nothing and is owed nothing, so
// every figure here is taken over the live order book only.
const LIVE = { status: { not: "CANCELLED" } } as const;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Figures for the Quick Stats row. Deliberately unfiltered — these describe the
 * shop as a whole, so they stay put while the operator narrows the table below
 * them. totalAmount is a Prisma Decimal, hence the Number() conversions.
 */
export async function getOrderStats(): Promise<OrderStats> {
  const today = startOfToday();

  const [byStatus, total, deliveredToday, todayRevenue, allTime, owed] =
    await Promise.all([
      prisma.booking.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: LIVE,
      }),
      prisma.booking.count({ where: LIVE }),
      prisma.booking.count({
        where: { status: "DELIVERED", deliveredAt: { gte: today } },
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { ...LIVE, createdAt: { gte: today } },
      }),
      prisma.booking.aggregate({ _avg: { totalAmount: true }, where: LIVE }),
      // Everything still owed across the shop, not just today - an unpaid
      // order from last week is money outstanding all the same.
      prisma.booking.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        where: LIVE,
      }),
    ]);

  const counts = new Map(byStatus.map((row) => [row.status, row._count._all]));

  return {
    total,
    received: counts.get("RECEIVED") ?? 0,
    ready: counts.get("READY") ?? 0,
    deliveredToday,
    revenueToday: Number(todayRevenue._sum.totalAmount ?? 0),
    averageOrderValue: Number(allTime._avg.totalAmount ?? 0),
    outstanding: balanceOf(
      Number(owed._sum.totalAmount ?? 0),
      Number(owed._sum.paidAmount ?? 0)
    ),
  };
}
