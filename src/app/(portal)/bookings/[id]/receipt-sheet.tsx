import {
  getExpectedDelivery,
  shopContacts,
  shortDate,
  statusLabel,
  PAYMENT_METHODS,
} from "@/lib/receipt-data";

/**
 * The printable receipt. Hidden on screen, shown only to the printer, so that
 * pressing Print produces the 80mm slip rather than a screenshot of the web
 * page. Dimensions mirror lib/receipt-pdf so the paper output matches the PDF.
 *
 * Sizes are in pt for the same reason the PDF uses them: this is print-only
 * output on a fixed 80mm roll, so it should not scale with the app's rem base.
 */

const RULE = "#dedede";
const HAIRLINE = "#bdbdbd";
const MUTED = "#5c5c5c";
// Light enough that a thermal head barely registers it, so the summary block
// still reads as a block on paper without printing a grey slab.
const WASH = "#f4f4f4";
const CONTENT_WIDTH = "202.77pt"; // 80mm roll less its dead margin

type Booking = {
  bookingCode: string;
  customerName: string;
  phone: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  notes: string | null;
  createdAt: Date | string;
  items: {
    id: string;
    itemName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
};

function Rule() {
  return <div style={{ borderBottom: `1px solid ${RULE}`, margin: "7pt 0" }} />;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "8pt",
        marginBottom: "4pt",
      }}
    >
      <span style={{ fontSize: "8pt", color: MUTED }}>{label}</span>
      <span
        style={{
          fontSize: "8.5pt",
          fontWeight: 700,
          textAlign: "right",
          maxWidth: "62%",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ReceiptSheet({
  booking,
  shopName,
}: {
  booking: Booking;
  shopName: string;
}) {
  const contacts = shopContacts();
  const created = new Date(booking.createdAt);
  const expected = getExpectedDelivery(booking.createdAt);
  const settled = booking.remainingAmount <= 0;

  return (
    <div
      id="receipt-sheet"
      // Parked off-screen rather than display:none, because the print helper
      // has to measure its height to give @page a concrete size — a hidden
      // element measures zero. The print stylesheet brings it back on-page.
      style={{
        position: "fixed",
        left: "-10000px",
        top: 0,
        width: CONTENT_WIDTH,
        padding: "4mm 0",
        fontFamily: "Helvetica, Arial, sans-serif",
        fontSize: "8.5pt",
        color: "#000000",
        lineHeight: 1.25,
      }}
    >
      <div style={{ textAlign: "center" }}>
        {/* The asset is a full lockup — monogram, shop name and "since" line —
            so it is printed large enough to be read as the name. Setting the
            shop name in type underneath it only said the same thing twice.
            Height derived from the asset's own 377x362 so it is never squashed. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/white-rose-logo.png"
          alt=""
          style={{
            width: "84pt",
            height: `${(84 * 362) / 377}pt`,
            display: "inline-block",
          }}
        />
        <div style={{ marginTop: "5pt" }}>
          {contacts.map((contact) => (
            <div
              key={contact}
              style={{ fontSize: "7.5pt", color: MUTED, marginTop: "2.5pt" }}
            >
              {contact}
            </div>
          ))}
        </div>
      </div>

      <Rule />

      {/* The booking number is what a customer reads out at the counter, so it
          gets a frame of its own rather than a line among the other details. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: `1px solid ${HAIRLINE}`,
          borderRadius: "3pt",
          padding: "6pt 8pt",
        }}
      >
        <div>
          <div style={{ fontSize: "6.5pt", color: MUTED, letterSpacing: "1pt" }}>
            RECEIPT
          </div>
          <div style={{ fontSize: "13pt", fontWeight: 700, marginTop: "2pt" }}>
            {booking.bookingCode}
          </div>
        </div>
        <div
          style={{
            border: "1px solid #000000",
            borderRadius: "2pt",
            padding: "2.5pt 5pt",
            fontSize: "7pt",
            fontWeight: 700,
            letterSpacing: "0.8pt",
          }}
        >
          {(statusLabel[booking.status] ?? booking.status).toUpperCase()}
        </div>
      </div>

      <Rule />

      <MetaRow label="Customer" value={booking.customerName} />
      <MetaRow label="Phone" value={booking.phone} />
      <MetaRow label="Received" value={shortDate(created)} />
      <MetaRow label="Expected" value={shortDate(expected)} />

      <Rule />

      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${HAIRLINE}`,
          paddingBottom: "3pt",
          marginBottom: "5pt",
          fontSize: "7pt",
          color: MUTED,
          letterSpacing: "1pt",
        }}
      >
        <span style={{ width: "73%" }}>ITEM</span>
        <span style={{ width: "27%", textAlign: "right" }}>AMOUNT</span>
      </div>

      {booking.items.map((item) => (
        <div key={item.id} style={{ display: "flex", marginBottom: "5pt" }}>
          <div style={{ width: "73%", paddingRight: "4pt" }}>
            <div>{item.itemName}</div>
            <div
              style={{ fontSize: "7.5pt", color: MUTED, marginTop: "1.5pt" }}
            >
              {item.quantity} &times; {item.unitPrice.toFixed(2)}
            </div>
          </div>
          <div style={{ width: "27%", textAlign: "right" }}>
            {item.lineTotal.toFixed(2)}
          </div>
        </div>
      ))}

      <Rule />

      {/* Total, what has been paid and what is still owed belong together: read
          as one block they answer the only question anyone asks the counter. */}
      <div
        style={{
          backgroundColor: WASH,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: "3pt",
          padding: "7pt 9pt",
          // Chrome drops backgrounds from print by default; without this the
          // block would lose the wash the PDF has.
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontSize: "9pt", fontWeight: 700, letterSpacing: "1pt" }}
          >
            TOTAL
          </span>
          <span style={{ fontSize: "14pt", fontWeight: 700 }}>
            {booking.totalAmount.toFixed(2)}
          </span>
        </div>

        {/* Only worth printing once money has changed hands. */}
        {booking.paidAmount > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "4pt",
            }}
          >
            <span style={{ fontSize: "8pt", color: MUTED }}>Paid</span>
            <span style={{ fontSize: "8.5pt" }}>
              {booking.paidAmount.toFixed(2)}
            </span>
          </div>
        )}

        <div
          style={{
            borderBottom: `1px solid ${HAIRLINE}`,
            margin: "6pt 0",
          }}
        />

        {/* The figure the counter is asked about first, so it closes the block
            in its own weight rather than sitting among the other details. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontSize: "8pt", fontWeight: 700, letterSpacing: "0.8pt" }}
          >
            {settled ? "BALANCE" : "BALANCE DUE"}
          </span>
          <span
            style={
              settled
                ? { fontSize: "9pt", fontWeight: 700, letterSpacing: "0.5pt" }
                : { fontSize: "11pt", fontWeight: 700 }
            }
          >
            {settled ? "PAID IN FULL" : booking.remainingAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <Rule />

      <div
        style={{
          fontSize: "6.5pt",
          color: MUTED,
          letterSpacing: "1.4pt",
          textAlign: "center",
          marginBottom: "5pt",
        }}
      >
        SCAN TO PAY
      </div>
      <div style={{ display: "flex" }}>
        {PAYMENT_METHODS.map((method) => (
          <div
            key={method.key}
            style={{
              width: "50%",
              padding: "0 2pt",
              textAlign: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/pay-${method.key}.png`}
              alt=""
              style={{ width: "76pt", height: "76pt", display: "inline-block" }}
            />
            <div
              style={{ fontSize: "8pt", fontWeight: 700, marginTop: "5pt" }}
            >
              {method.provider}
            </div>
            <div style={{ fontSize: "7.5pt", marginTop: "1.5pt" }}>
              {method.holder}
            </div>
            <div style={{ fontSize: "7.5pt", color: MUTED, marginTop: "1pt" }}>
              {method.account}
            </div>
          </div>
        ))}
      </div>

      {booking.notes && (
        <>
          <Rule />
          <div
            style={{ fontSize: "6.5pt", color: MUTED, letterSpacing: "1.4pt" }}
          >
            NOTES
          </div>
          <div style={{ fontSize: "8pt", lineHeight: 1.3, marginTop: "3pt" }}>
            {booking.notes}
          </div>
        </>
      )}

      <Rule />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "8pt", color: MUTED }}>
          Thank you for choosing {shopName}!
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/nexivo-studio.png"
          alt=""
          style={{
            width: "54pt",
            height: `${(54 * 210) / 381}pt`,
            marginTop: "6pt",
            display: "inline-block",
          }}
        />
        <div
          style={{
            fontSize: "7pt",
            color: "#909090",
            marginTop: "3pt",
            letterSpacing: "0.3pt",
          }}
        >
          System by NexivoStudio.io
        </div>
      </div>
    </div>
  );
}
