/**
 * Builds a wa.me click-to-chat link with a pre-filled message.
 * Opening this link launches WhatsApp with the message already typed —
 * the person still has to tap Send themselves. No API, no setup.
 */
import { COUNTRY_DIAL_CODE, nationalPhoneDigits } from "@/lib/phone";

/**
 * wa.me needs a full international number as bare digits. New bookings are
 * stored that way already, but numbers taken before the country code was fixed
 * on the form are local ("03001234567"), so both are put through the same
 * national-part extraction and given the country code back.
 */
function toInternationalDigits(phone: string): string {
  return `${COUNTRY_DIAL_CODE}${nationalPhoneDigits(phone)}`;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${toInternationalDigits(phone)}?text=${encodeURIComponent(message)}`;
}
