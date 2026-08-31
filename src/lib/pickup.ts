/**
 * The choices a customer is offered on the pickup form. Shared with the portal
 * so the counter's screen labels a request the same way the customer saw it.
 */

/**
 * What the shop can be asked to do. Overridable because not every shop offers
 * all four — a shop that does not dry clean should not be taking dry cleaning
 * requests it has to turn down.
 *
 * Format: a comma-separated list, e.g.
 *   SHOP_SERVICES="Wash & Iron,Dry Cleaning"
 */
const DEFAULT_SERVICES = [
  "Wash & Iron",
  "Wash Only",
  "Iron / Press Only",
  "Dry Cleaning",
];

/**
 * A line saying what each service is, for the website.
 *
 * Definitions, not claims: what "wash only" means is the same in every shop,
 * whereas anything about solvents, machines or turnaround would be a promise
 * this file is in no position to make. A service the shop renames simply
 * appears without a note rather than borrowing someone else's.
 */
export const SERVICE_NOTES: Record<string, string> = {
  "Wash & Iron": "Washed, dried and pressed, ready to hang straight up.",
  "Wash Only": "Washed, dried and folded. Nothing pressed.",
  "Iron / Press Only": "Already clean, only creased. Pressed and returned.",
  "Dry Cleaning":
    "For suits, formal wear and anything that should not go near water.",
};

export function pickupServices(): string[] {
  const raw = process.env.SHOP_SERVICES?.trim();
  if (!raw) return DEFAULT_SERVICES;
  const list = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_SERVICES;
}

/**
 * When a rider can come. Three windows rather than a free-text time, so the
 * shop is agreeing to an afternoon rather than to 4:15 exactly.
 *
 * Format: "Label,Label", e.g. SHOP_PICKUP_SLOTS="10:00 AM - 1:00 PM,..."
 */
const DEFAULT_SLOTS = [
  "12:00 PM - 3:00 PM",
  "3:00 PM - 6:00 PM",
  "6:00 PM - 9:00 PM",
];

export function pickupSlots(): string[] {
  const raw = process.env.SHOP_PICKUP_SLOTS?.trim();
  if (!raw) return DEFAULT_SLOTS;
  const list = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_SLOTS;
}

/**
 * How far ahead a pickup may be booked. Today is allowed — someone asking at
 * nine in the morning for an afternoon collection is the common case.
 */
export const PICKUP_DAYS_AHEAD = 14;

/** yyyy-mm-dd in the shop's own day, for the date input's min/max. */
export function isoDay(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
