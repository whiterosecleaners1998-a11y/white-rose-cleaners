import { NextRequest, NextResponse } from "next/server";
import { isValidReceiptToken } from "@/lib/receipt-link";
import { renderReceiptPdf } from "@/lib/receipt-file";

/**
 * The customer-facing receipt, linked from the WhatsApp message. Public by
 * design (see proxy.ts), so the signature is the only thing standing between
 * a stranger and someone's order — check it before touching the database.
 *
 * A bad token answers 404 rather than 403: there is no reason to confirm that
 * an id exists to someone who cannot produce its signature.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("t");

  if (!isValidReceiptToken(id, token)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const receipt = await renderReceiptPdf(id);
  if (!receipt) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(receipt.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      // Inline so tapping the link shows the receipt rather than kicking off
      // a download the customer then has to go hunting for.
      "Content-Disposition": `inline; filename="receipt-${receipt.bookingCode}.pdf"`,
      // Signed and immutable, but keep it off shared caches all the same.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
