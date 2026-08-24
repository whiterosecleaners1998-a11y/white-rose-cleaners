/**
 * Builds a wa.me click-to-chat link with a pre-filled message.
 * Opening this link launches WhatsApp with the message already typed —
 * the person still has to tap Send themselves. No API, no setup.
 */

/**
 * wa.me needs a full international number as bare digits. Customer phones are
 * stored the way they were typed (see normalizePhone), so a local "03001234567"
 * has to gain a country code and lose its trunk zero. Mirrors toWhatsAppAddress
 * in whatsapp.ts, which does the same for Twilio.
 */
function toInternationalDigits(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed.replace(/\D/g, "");
  const countryCode = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "92";
  return `${countryCode}${trimmed.replace(/\D/g, "").replace(/^0/, "")}`;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${toInternationalDigits(phone)}?text=${encodeURIComponent(message)}`;
}
