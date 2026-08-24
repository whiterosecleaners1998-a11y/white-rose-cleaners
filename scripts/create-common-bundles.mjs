// Creates the everyday bundles for the shop. Idempotent: a bundle whose name
// already exists is left alone, so this can be re-run safely.
//
// Eight is deliberate. The booking form hands out keyboard shortcuts from
// BUNDLE_KEYS (nine home-row letters) and the shop already has one bundle, so
// eight more fills the row exactly and every bundle keeps a shortcut.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const BUNDLES = [
  ["Shalwar Kameez (F)", [["Kamiz (F)", 1], ["Shalwar (F)", 1]]],
  ["3 Piece Suit (F)", [["Kamiz (F)", 1], ["Shalwar (F)", 1], ["Dupatta (Plain)", 1]]],
  ["Shirt & Trousers (M)", [["Shirt (M)", 1], ["Trousers (M)", 1]]],
  ["Shirt & Jeans (M)", [["Shirt (M)", 1], ["Jeans / Pant (M)", 1]]],
  ["Bed Set (Single)", [["Bedsheet (Single)", 1], ["Pillow Cover", 1]]],
  ["Bed Set (Double)", [["Bedsheet (Double)", 1], ["Pillow Cover", 2]]],
  ["Towel Set", [["Bath Towel", 1], ["Hand Towel", 1], ["Face Towel", 1]]],
  ["Curtains Pair (Normal)", [["Curtains per Panel (Normal)", 2]]],
];

const items = await prisma.priceListItem.findMany({ where: { active: true } });
const byName = new Map(items.map((i) => [i.name, i]));

// Fail before writing anything rather than half-creating a set of bundles.
const missing = BUNDLES.flatMap(([, lines]) =>
  lines.map(([name]) => name).filter((n) => !byName.has(n)),
);
if (missing.length) {
  console.error("Missing price list items:", [...new Set(missing)].join(", "));
  process.exit(1);
}

const highest = await prisma.bundle.aggregate({ _max: { sortOrder: true } });
let sortOrder = (highest._max.sortOrder ?? 0) + 1;

for (const [name, lines] of BUNDLES) {
  const existing = await prisma.bundle.findUnique({ where: { name } });
  if (existing) {
    console.log(`skip   ${name} (already exists)`);
    continue;
  }
  await prisma.bundle.create({
    data: {
      name,
      sortOrder: sortOrder++,
      items: {
        create: lines.map(([itemName, quantity]) => ({
          itemId: byName.get(itemName).id,
          quantity,
        })),
      },
    },
  });
  const total = lines.reduce(
    (sum, [itemName, qty]) => sum + Number(byName.get(itemName).price) * qty,
    0,
  );
  const desc = lines.map(([n, q]) => `${q}x ${n}`).join(" + ");
  console.log(`create ${name.padEnd(24)} ${String(total).padStart(5)}  ${desc}`);
}

await prisma.$disconnect();
