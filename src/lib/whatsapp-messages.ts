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

type Payment = { paidAmount?: number; remainingAmount?: number };

/**
 * Money still owed, in the customer's words. Silent when nothing has been paid
 * — the total is already in the message and repeating it as "baqaya" only adds
 * noise — and silent again once the order is settled on a Received message,
 * where the useful fact is the amount, not the absence of a debt.
 */
function paymentSentence({ paidAmount, remainingAmount }: Payment): string {
  if (paidAmount === undefined || remainingAmount === undefined) return "";
  if (paidAmount <= 0) return "";
  if (remainingAmount <= 0) return " Poori adaigi mil chuki hai.";
  return ` Advance: Rs. ${paidAmount.toFixed(
    2
  )}. Baqaya: Rs. ${remainingAmount.toFixed(2)}.`;
}

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
  paidAmount,
  remainingAmount,
}: {
  customerName: string;
  bookingCode: string;
  totalAmount: number;
  shopName: string;
  receiptUrl?: string;
} & Payment): string {
  const body = `Assalam-o-Alaikum ${customerName}, aap ka order #${bookingCode} hamein mil gaya hai. Total: Rs. ${totalAmount.toFixed(
    2
  )}.${paymentSentence({ paidAmount, remainingAmount })} Kapre taiyar hote hi hum aap ko message kar denge.`;
  return `${withReceipt(body, receiptUrl)}\n\nShukriya! - ${shopName}`;
}

export function orderReadyMessage({
  customerName,
  bookingCode,
  shopName,
  receiptUrl,
  remainingAmount,
}: {
  customerName: string;
  bookingCode: string;
  shopName: string;
  receiptUrl?: string;
} & Payment): string {
  // Unlike the received message this one never quoted a figure, so the balance
  // is worth stating outright however the order was paid - it is what the
  // customer needs to bring with them.
  const due =
    remainingAmount && remainingAmount > 0
      ? ` Baqaya Rs. ${remainingAmount.toFixed(2)} pickup par ada kar dijiye ga.`
      : "";
  const body = `Assalam-o-Alaikum ${customerName}, aap ka order #${bookingCode} taiyar hai. Aap kisi bhi waqt tashreef la kar le ja sakte hain.${due}`;
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
