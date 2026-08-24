// Read-only: dumps the active price list and any existing bundles, so bundle
// definitions can be written against real ids and names rather than guesses.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const items = await prisma.priceListItem.findMany({
  where: { active: true },
  orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
});
console.log(`${items.length} active items`);
for (const i of items) {
  console.log(`  ${i.id}  ${String(Number(i.price)).padStart(6)}  ${i.name}`);
}

const bundles = await prisma.bundle.findMany({
  include: { items: { include: { item: true } } },
  orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
});
console.log(`\n${bundles.length} existing bundle(s)`);
for (const b of bundles) {
  const lines = b.items
    .map((l) => `${l.quantity}x ${l.item.name}`)
    .join(", ");
  console.log(`  ${b.name}: ${lines}`);
}

await prisma.$disconnect();
