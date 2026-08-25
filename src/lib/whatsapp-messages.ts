/**
 * The WhatsApp message templates, in one place so the booking form and the
 * booking page cannot drift apart — the same text is reachable from both.
 *
 * Roman Urdu rather than Urdu script: it renders on any handset with no RTL or
 * font trouble, and staff and customers read it equally well.
 *
 * The customer-facing ones are signed with the shop name on purpose. These go
 * out as wa.me links, so they send from whichever staff member taps Send — the
 * customer sees an unfamiliar number, and unsigned that reads like a stranger.
 *
 * A wa.me link can only carry text, never an attachment, so the receipt travels
 * as a signed URL the customer taps (see receipt-link.ts). It is optional: with
 * no URL the message reads exactly as it did before.
 */

/** Blank lines around the link so WhatsApp shows it as its own tappable row. */
function withReceipt(body: string, receiptUrl: string | undefined): string {
  return receiptUrl ? `${body}\n\nReceipt: ${receiptUrl}` : body;
}

export function orderReceivedMessage({
  customerName,
  bookingCode,
  totalAmount,
  shopName,
  receiptUrl,
}: {
  customerName: string;
  bookingCode: string;
  totalAmount: number;
  shopName: string;
  receiptUrl?: string;
}): string {
  const body = `Assalam-o-Alaikum ${customerName}, aap ka order #${bookingCode} hamein mil gaya hai. Total: Rs. ${totalAmount.toFixed(
    2
  )}. Kapre taiyar hote hi hum aap ko message kar denge.`;
  return `${withReceipt(body, receiptUrl)}\n\nShukriya! - ${shopName}`;
}

export function orderReadyMessage({
  customerName,
  bookingCode,
  shopName,
  receiptUrl,
}: {
  customerName: string;
  bookingCode: string;
  shopName: string;
  receiptUrl?: string;
}): string {
  const body = `Assalam-o-Alaikum ${customerName}, aap ka order #${bookingCode} taiyar hai. Aap kisi bhi waqt tashreef la kar le ja sakte hain.`;
  return `${withReceipt(body, receiptUrl)}\n\nShukriya! - ${shopName}`;
}

/** Goes to the owner rather than a customer, so it stays terse and unsigned. */
export function ownerNewBookingMessage({
  customerName,
  bookingCode,
  phone,
  totalAmount,
}: {
  customerName: string;
  bookingCode: string;
  phone: string;
  totalAmount: number;
}): string {
  return `Nayi booking #${bookingCode}: ${customerName} (${phone}) - total Rs. ${totalAmount.toFixed(
    2
  )}`;
}
