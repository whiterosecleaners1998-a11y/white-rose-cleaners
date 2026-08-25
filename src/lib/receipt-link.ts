/**
 * Signed, public receipt links.
 *
 * The portal sits behind a shared password, so a customer cannot open
 * /api/bookings/<id>/pdf. To send a receipt over WhatsApp we need a URL that
 * works without logging in — but an unguarded /r/<id> would let anyone walk
 * the ids and read every customer's name, phone and order.
 *
 * So each link carries an HMAC of the booking id. Without the shop's
 * SESSION_SECRET the token cannot be produced, and the id alone is useless.
 * Links do not expire: a receipt stays openable for as long as the customer
 * keeps the message, the same way a paper receipt does.
 *
 * Server-only — SESSION_SECRET must never reach the browser. Pass the built
 * URL down as a prop instead of importing this from a client component.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** 24 base64url chars ≈ 144 bits kept from the digest. Ample, and it keeps
 *  the link short enough to read on a phone. */
const TOKEN_LENGTH = 24;

function signBookingId(id: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return createHmac("sha256", secret)
    .update(id)
    .digest("base64url")
    .slice(0, TOKEN_LENGTH);
}

export function isValidReceiptToken(id: string, token: string | null): boolean {
  if (!token) return false;
  const expected = Buffer.from(signBookingId(id));
  const given = Buffer.from(token);
  // Length has to match before timingSafeEqual will look at the bytes.
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function buildReceiptUrl(origin: string, id: string): string {
  return `${origin}/r/${id}?t=${signBookingId(id)}`;
}
