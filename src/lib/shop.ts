/**
 * The branding that changes from one shop to the next.
 *
 * Read from the environment rather than written into the code, so this one
 * repo can run as any shop's portal: give a deployment its own database and
 * its own values here and it is their portal, not White Rose's.
 *
 * Both are NEXT_PUBLIC_ because the logo is drawn on the login screen and the
 * printable receipt, which the browser renders. Neither is a secret.
 */

/**
 * The shop's logo. Either a file dropped into public/ and named here
 * ("/white-rose-logo.png") or a full https:// URL to one hosted elsewhere.
 * Left empty, the portal falls back to the shop's name in type and receipts
 * print without a logo.
 */
export const SHOP_LOGO = process.env.NEXT_PUBLIC_SHOP_LOGO?.trim() ?? "";

/** The small line under the shop name in the sidebar, e.g. "Since 1998". */
export const SHOP_TAGLINE = process.env.NEXT_PUBLIC_SHOP_TAGLINE?.trim() ?? "";

/**
 * The same mark for dark surfaces — the site's footer, and anywhere else the
 * background is ink rather than paper.
 *
 * A logo drawn in black type cannot simply be dropped on a dark panel: the type
 * disappears and, if the file has no transparency, it arrives as a white slab.
 * So this is its own file rather than a filter over the light one, which would
 * have to invert the brand colours along with the black.
 *
 * Left empty, dark surfaces fall back to the shop's name set in type, which is
 * what they did before this existed.
 */
export const SHOP_LOGO_DARK =
  process.env.NEXT_PUBLIC_SHOP_LOGO_DARK?.trim() ?? "";
