/**
 * Renders a booking's receipt PDF. Shared by the staff-facing download route
 * and the public signed-link route so the two cannot produce different papers.
 */
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/serialize";
import { ReceiptDocument, estimateHeight } from "@/lib/receipt-pdf";

/**
 * A receipt must come out as one page however long it runs — it is cut off a
 * roll, so a second page is a second slip that the customer has to be handed
 * separately and that a phone screen scrolls past.
 *
 * estimateHeight can only approximate where text wraps, and when it comes up
 * even one line short the tail drops onto a second page. Rather than trust it,
 * the render is checked against react-pdf's own layout and repeated on a taller
 * page until it holds. A good estimate is still worth having: it is what keeps
 * this to a single pass for all but the occasional awkward booking.
 */
const MAX_ATTEMPTS = 5;

/**
 * The estimate is calibrated to within about 26pt, so a miss is a line or two
 * and the first retry only needs to add a few lines — adding more would cut a
 * visibly long tail of blank roll for nothing.
 *
 * If that still spills, the estimate was not merely off but wrong, and creeping
 * upwards would run out of attempts before it ever fit. How many pages the
 * content just filled says how much taller it needs to be, so from there the
 * height is multiplied rather than nudged. Slack costs roll; a second page
 * costs a second slip.
 */
function grow(height: number, pages: number, attempt: number): number {
  if (attempt === 1) return height + 72;
  return Math.ceil(height * pages);
}

/** Page tree nodes are `/Type /Pages`, so the trailing character is what tells
 *  a page apart from the node that lists them. */
function pageCount(buffer: Buffer): number {
  return (buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

async function renderOnOnePage(
  booking: Parameters<typeof estimateHeight>[0],
  shopName: string
): Promise<Buffer> {
  let height = estimateHeight(booking);

  for (let attempt = 1; ; attempt++) {
    const buffer = await renderToBuffer(
      <ReceiptDocument booking={booking} shopName={shopName} height={height} />
    );
    const pages = pageCount(buffer);
    // A count of 0 means the regex found nothing to go on; growing the page on
    // that basis would just print a long blank tail, so take what we have.
    if (pages <= 1 || attempt === MAX_ATTEMPTS) return buffer;
    height = grow(height, pages, attempt);
  }
}

/** Returns null when no booking has that id, so callers can 404. */
export async function renderReceiptPdf(
  id: string
): Promise<{ buffer: Buffer; bookingCode: string } | null> {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!booking) return null;

  const b = serializeBooking(booking);
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";
  const buffer = await renderOnOnePage(b, shopName);

  return { buffer, bookingCode: b.bookingCode };
}
