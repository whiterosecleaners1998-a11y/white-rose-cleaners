/**
 * Phone numbers are entered without a country code — the form fixes "+92" in
 * place — and stored in full international form. These helpers move between
 * the two, and give search a key that matches numbers saved either way.
 */

export const COUNTRY_DIAL_CODE =
  process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "92";

/**
 * The national part of a number: bare digits, no country code, no trunk zero.
 * Accepts anything a person might type or paste — "+92 300 1234567",
 * "0300-1234567", "923001234567" — and lands on the same "3001234567".
 *
 * The country code is only stripped when enough digits follow to be a real
 * number, so a local number that happens to start with those digits survives.
 */
export function nationalPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const withoutCountry =
    digits.startsWith(COUNTRY_DIAL_CODE) &&
    digits.length > COUNTRY_DIAL_CODE.length + 7
      ? digits.slice(COUNTRY_DIAL_CODE.length)
      : digits;
  return withoutCountry.replace(/^0+/, "");
}

/** Full international form, e.g. "+923001234567". Empty in, empty out. */
export function toInternationalPhone(raw: string): string {
  const national = nationalPhoneDigits(raw);
  return national ? `+${COUNTRY_DIAL_CODE}${national}` : "";
}

/**
 * What to match a stored phone against. Numbers taken before the country code
 * was fixed sit in the database as "03001234567"; newer ones as
 * "+923001234567". Both contain the national part, so that is what we search.
 */
export function phoneSearchKey(raw: string): string {
  return nationalPhoneDigits(raw);
}
