/**
 * Monthly packages: a block of pieces bought up front at a better per-piece
 * rate than the counter charges.
 *
 * These are a commercial offer, not a fact about the software, so none of them
 * are written into the code. The shop sets its own tiers in the environment and
 * the packages page — and its link in the nav — only exists once it has. Left
 * unset, a customer is never shown a price the shop did not choose.
 *
 * Format: "pieces:price,pieces:price", cheapest first, e.g.
 *   SHOP_PACKAGES="50:5900,100:10300,150:13200"
 * Mark one as the one to push by suffixing a star: "100:10300*".
 */

export type LaundryPackage = {
  pieces: number;
  price: number;
  /** Rupees per piece, derived rather than quoted, so the two cannot disagree. */
  perPiece: number;
  /** The tier drawn forward on the page. At most one. */
  featured: boolean;
};

export function laundryPackages(): LaundryPackage[] {
  const raw = process.env.SHOP_PACKAGES?.trim();
  if (!raw) return [];

  const packages: LaundryPackage[] = [];

  for (const entry of raw.split(",")) {
    const text = entry.trim();
    if (!text) continue;

    const featured = text.endsWith("*");
    const [piecesText, priceText] = (featured ? text.slice(0, -1) : text).split(
      ":"
    );

    const pieces = Number(piecesText);
    const price = Number(priceText);
    // A malformed entry is dropped rather than rendered as NaN or zero: a
    // wrong price on a public page is worse than a missing tier.
    if (!Number.isFinite(pieces) || pieces <= 0) continue;
    if (!Number.isFinite(price) || price <= 0) continue;

    packages.push({
      pieces,
      price,
      perPiece: Math.round(price / pieces),
      featured,
    });
  }

  // Only one tier can be the featured one; if the shop starred several, the
  // first wins rather than the page shouting in three places at once.
  let seenFeatured = false;
  for (const item of packages) {
    if (item.featured && seenFeatured) item.featured = false;
    else if (item.featured) seenFeatured = true;
  }

  return packages.sort((a, b) => a.pieces - b.pieces);
}
