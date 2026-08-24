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
 */

export function orderReceivedMessage({
  customerName,
  bookingCode,
  totalAmount,
  shopName,
}: {
  customerName: string;
  bookingCode: string;
  totalAmount: number;
  shopName: string;
}): string {
  return `Assalam-o-Alaikum ${customerName}, aap ka order #${bookingCode} hamein mil gaya hai. Total: Rs. ${totalAmount.toFixed(
    2
  )}. Kapre taiyar hote hi hum aap ko message kar denge. Shukriya! - ${shopName}`;
}

export function orderReadyMessage({
  customerName,
  bookingCode,
  shopName,
}: {
  customerName: string;
  bookingCode: string;
  shopName: string;
}): string {
  return `Assalam-o-Alaikum ${customerName}, aap ka order #${bookingCode} taiyar hai. Aap kisi bhi waqt tashreef la kar le ja sakte hain. Shukriya! - ${shopName}`;
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
