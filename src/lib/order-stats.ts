import { prisma } from "@/lib/prisma";

export type OrderStats = {
  total: number;
  received: number;
  ready: number;
  deliveredToday: number;
  revenueToday: number;
  averageOrderValue: number;
};

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

  const [byStatus, total, deliveredToday, todayRevenue, allTime] =
    await Promise.all([
      prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.booking.count(),
      prisma.booking.count({
        where: { status: "DELIVERED", deliveredAt: { gte: today } },
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: today } },
      }),
      prisma.booking.aggregate({ _avg: { totalAmount: true } }),
    ]);

  const counts = new Map(byStatus.map((row) => [row.status, row._count._all]));

  return {
    total,
    received: counts.get("RECEIVED") ?? 0,
    ready: counts.get("READY") ?? 0,
    deliveredToday,
    revenueToday: Number(todayRevenue._sum.totalAmount ?? 0),
    averageOrderValue: Number(allTime._avg.totalAmount ?? 0),
  };
}
