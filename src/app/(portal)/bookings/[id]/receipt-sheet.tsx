import {
  getExpectedDelivery,
  shopContacts,
  shortDate,
  statusLabel,
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
const MUTED = "#5c5c5c";
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
  return (
    <div style={{ borderBottom: `1px solid ${RULE}`, margin: "6pt 0" }} />
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "8pt",
        marginBottom: "3.5pt",
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/white-rose-logo.png"
          alt=""
          style={{ width: "46pt", height: "44pt", display: "inline-block" }}
        />
        <div
          style={{
            fontSize: "10pt",
            fontWeight: 700,
            marginTop: "6pt",
            letterSpacing: "0.3pt",
          }}
        >
          {shopName.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: "8pt",
            color: MUTED,
            marginTop: "3pt",
            letterSpacing: "0.4pt",
          }}
        >
          RECEIPT #{booking.bookingCode} &middot;{" "}
          {(statusLabel[booking.status] ?? booking.status).toUpperCase()}
        </div>
        {contacts.map((contact) => (
          <div
            key={contact}
            style={{ fontSize: "7.5pt", color: MUTED, marginTop: "2pt" }}
          >
            {contact}
          </div>
        ))}
      </div>

      <Rule />

      <MetaRow label="Customer" value={booking.customerName} />
      <MetaRow label="Phone" value={booking.phone} />
      <MetaRow label="Received" value={shortDate(created)} />
      <MetaRow label="Booking #" value={booking.bookingCode} />
      <MetaRow label="Expected" value={shortDate(expected)} />
      {/* Sits with the customer's details rather than under the total: it is
          the figure the counter is asked about first. */}
      <MetaRow
        label="Balance"
        value={
          booking.remainingAmount > 0
            ? booking.remainingAmount.toFixed(2)
            : "Paid in full"
        }
      />

      <Rule />

      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${RULE}`,
          paddingBottom: "3pt",
          marginBottom: "3pt",
          fontSize: "7.5pt",
          color: MUTED,
          letterSpacing: "0.5pt",
        }}
      >
        <span style={{ width: "73%" }}>ITEM</span>
        <span style={{ width: "27%", textAlign: "right" }}>AMOUNT</span>
      </div>

      {booking.items.map((item) => (
        <div key={item.id} style={{ display: "flex", marginBottom: "4pt" }}>
          <div style={{ width: "73%", paddingRight: "4pt" }}>
            <div>{item.itemName}</div>
            <div style={{ fontSize: "7.5pt", color: MUTED, marginTop: "1pt" }}>
              {item.quantity} &times; {item.unitPrice.toFixed(2)}
            </div>
          </div>
          <div style={{ width: "27%", textAlign: "right" }}>
            {item.lineTotal.toFixed(2)}
          </div>
        </div>
      ))}

      <Rule />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{ fontSize: "9pt", fontWeight: 700, letterSpacing: "0.5pt" }}
        >
          TOTAL
        </span>
        <span style={{ fontSize: "13pt", fontWeight: 700 }}>
          {booking.totalAmount.toFixed(2)}
        </span>
      </div>

      {/* Mirrors the PDF: printed only once money has changed hands. The
          balance itself is stated up with the customer's details. */}
      {booking.paidAmount > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "3pt",
            fontSize: "8.5pt",
          }}
        >
          <span style={{ color: MUTED }}>Paid</span>
          <span>{booking.paidAmount.toFixed(2)}</span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: "8pt",
          paddingTop: "8pt",
          borderTop: `1px solid ${RULE}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/qr.png"
          alt=""
          style={{ width: "52pt", height: "52pt", marginRight: "10pt" }}
        />
        <div>
          <div style={{ fontSize: "7.5pt", color: MUTED, letterSpacing: "0.5pt" }}>
            SCAN TO PAY
          </div>
          <div style={{ fontSize: "9pt", fontWeight: 700, marginTop: "2pt" }}>
            Meezan Bank
          </div>
        </div>
      </div>

      {booking.notes && (
        <>
          <Rule />
          <div style={{ fontSize: "8pt", color: MUTED, lineHeight: 1.3 }}>
            Notes: {booking.notes}
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
