/**
 * Values shared by the two renderings of a receipt: the PDF (lib/receipt-pdf)
 * and the printable HTML sheet on the booking page. Keeping them here is what
 * stops the two from drifting apart.
 */

/**
 * Contact numbers printed under the receipt line. Read from the environment so
 * the shop can change who is on call without a code change, defaulting to the
 * two numbers the shop supplied. Format: "Name:Number,Name:Number".
 */
export function shopContacts(): string[] {
  return (
    process.env.SHOP_CONTACTS ??
    "Faizan:0333-1231404,Wajid Ali:0345-2235356"
  )
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      // Split on the last colon so a name may contain one.
      const at = entry.lastIndexOf(":");
      return at === -1
        ? entry
        : `${entry.slice(0, at).trim()}: ${entry.slice(at + 1).trim()}`;
    });
}

export function getExpectedDelivery(createdAt: Date | string): Date {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + 5);
  return date;
}

export function shortDate(value: Date): string {
  return value.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const statusLabel: Record<string, string> = {
  RECEIVED: "Received",
  READY: "Ready",
  DELIVERED: "Delivered",
};
