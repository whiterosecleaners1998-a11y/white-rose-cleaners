/**
 * Keyboard addressing for the booking form. Items answer to the number row and
 * bundles to letters, so both tabs stay reachable without switching.
 */

// Keys 1-9 then 0 address the first ten items on screen. Position follows the
// price list's own order (sortOrder, then name), so the digits stay put unless
// the Price List page is reordered.
export const ITEM_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

// What a bundle falls back to when the shop has not picked a letter for it.
// Home row, so it never fights the item digits.
export const SPARE_BUNDLE_KEYS = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];

/**
 * A shortcut is a single letter. Digits are refused because they belong to the
 * price list items. Returns null for anything else, including an empty string,
 * which is how "no shortcut, use a spare letter" is expressed.
 */
export function normalizeShortcut(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return /^[a-z]$/.test(key) ? key : null;
}

type Keyed = { id: string; shortcut?: string | null };

/**
 * The key each bundle answers to. Chosen letters win; everything left over
 * takes a spare home-row letter in list order.
 *
 * Pass every active bundle, not just the ones a search has left on screen, so
 * a letter means the same bundle from one keystroke to the next. Muscle memory
 * is the whole point of letting the shop choose them.
 */
export function resolveBundleKeys(bundles: Keyed[]): Map<string, string> {
  const chosen = new Set(
    bundles.map((bundle) => bundle.shortcut).filter(Boolean) as string[],
  );
  const spare = SPARE_BUNDLE_KEYS.filter((key) => !chosen.has(key));

  const keys = new Map<string, string>();
  let next = 0;
  for (const bundle of bundles) {
    if (bundle.shortcut) keys.set(bundle.id, bundle.shortcut);
    else if (next < spare.length) keys.set(bundle.id, spare[next++]);
  }
  return keys;
}
