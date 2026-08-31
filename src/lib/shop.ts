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
