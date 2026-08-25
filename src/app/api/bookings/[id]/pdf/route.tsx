import { NextRequest, NextResponse } from "next/server";
import { renderReceiptPdf } from "@/lib/receipt-file";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const inline = request.nextUrl.searchParams.get("inline") === "1";
  const receipt = await renderReceiptPdf(id);

  if (!receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(receipt.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="receipt-${receipt.bookingCode}.pdf"`,
    },
  });
}
