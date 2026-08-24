import fs from "fs";
import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const QR_CODE_BUFFER = fs.readFileSync(
  path.join(process.cwd(), "public", "qr.png")
);
const LOGO_BUFFER = fs.readFileSync(
  path.join(process.cwd(), "public", "white-rose-logo.png")
);
const NEXIVO_BUFFER = fs.readFileSync(
  path.join(process.cwd(), "public", "nexivo-studio.png")
);

type SerializedBooking = {
  id: string;
  bookingCode: string;
  customerName: string;
  phone: string;
  status: string;
  totalAmount: number;
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

// 80mm thermal roll: 226.77pt wide, of which roughly 203pt is printable once
// the dead margin at each edge is taken off. That printable width is exactly
// the column the reference receipt uses, so this is built to the same measure.
const PAGE_WIDTH = 226.77;
const PADDING_X = 12;
const CONTENT_WIDTH = PAGE_WIDTH - PADDING_X * 2;

const RULE = "#dedede";
const INK = "#000000";
const MUTED = "#5c5c5c";

// Contact numbers printed under the receipt line. Read from the environment so
// the shop can change who is on call without a code change, defaulting to the
// two numbers the shop supplied. Format: "Name:Number,Name:Number".
const SHOP_CONTACTS = (
  process.env.SHOP_CONTACTS ??
  "Faizan:0333-1231404,Wajid Ali:0345-2235356"
)
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    // Split on the last colon so a name may contain one.
    const at = entry.lastIndexOf(":");
    return at === -1
      ? { label: entry }
      : { label: `${entry.slice(0, at).trim()}: ${entry.slice(at + 1).trim()}` };
  });

// Every figure below was measured off real renders rather than guessed —
// scripts/check-receipt-height.mjs re-derives them and fails if the estimate
// ever falls short. A wrapped line costs less than a fresh row because only the
// name re-flows, not the qty/price sub-line beside it.
const BASE_HEIGHT = 372; // everything but the contacts, item rows and notes
const CONTACT_LINE = 10;
const ITEM_ROW = 24;
const EXTRA_LINE = 11;
const NOTES_BLOCK = 23; // rule + first line

// The first line of a cell fits more than the ones under it, so they are
// counted separately; a single average would either spill or waste paper.
const ITEM_FIRST_LINE = 43;
const ITEM_WRAP_LINE = 33;
const NOTE_FIRST_LINE = 55;
const NOTE_WRAP_LINE = 56;

function lineCount(text: string, firstLine: number, wrapLine: number) {
  if (text.length <= firstLine) return 1;
  return 1 + Math.ceil((text.length - firstLine) / wrapLine);
}

// Roll paper is cut where the content ends, so the page is only as tall as what
// it holds — a fixed page height is what turns a receipt into a wasted
// half-sheet. These figures mirror the styles below and run deliberately a
// shade generous: overshooting costs a sliver of paper, undershooting spills
// the tail onto a second cut.
export function estimateHeight(booking: SerializedBooking) {
  let h = BASE_HEIGHT + SHOP_CONTACTS.length * CONTACT_LINE;
  for (const item of booking.items) {
    const lines = lineCount(item.itemName, ITEM_FIRST_LINE, ITEM_WRAP_LINE);
    h += ITEM_ROW + (lines - 1) * EXTRA_LINE;
  }
  if (booking.notes) {
    const lines = lineCount(booking.notes, NOTE_FIRST_LINE, NOTE_WRAP_LINE);
    h += NOTES_BLOCK + (lines - 1) * EXTRA_LINE;
  }
  return Math.ceil(h);
}

const styles = StyleSheet.create({
  page: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: INK,
    paddingHorizontal: PADDING_X,
    paddingTop: 12,
    paddingBottom: 16,
  },
  header: { alignItems: "center" },
  logo: { width: 46, height: 44 },
  shopName: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 6,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  receiptLine: {
    fontSize: 8,
    color: MUTED,
    marginTop: 3,
    textAlign: "center",
    letterSpacing: 0.4,
  },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    marginVertical: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3.5,
  },
  metaLabel: { fontSize: 8, color: MUTED },
  metaValue: {
    fontSize: 8.5,
    fontWeight: 700,
    maxWidth: CONTENT_WIDTH * 0.62,
    textAlign: "right",
  },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    paddingBottom: 3,
    marginBottom: 3,
  },
  contactLine: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 2,
    textAlign: "center",
  },
  headText: { fontSize: 7.5, color: MUTED, letterSpacing: 0.5 },
  itemRow: { flexDirection: "row", marginBottom: 4 },
  // The reference splits its item table 73/27; the same ratio leaves the amount
  // column wide enough for a five-figure line without crowding item names.
  colItem: { width: "73%", paddingRight: 4 },
  colAmount: { width: "27%", textAlign: "right" },
  itemName: { fontSize: 8.5, lineHeight: 1.25 },
  itemBreak: { fontSize: 7.5, color: MUTED, marginTop: 1 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5 },
  totalValue: { fontSize: 13, fontWeight: 700 },
  payBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: RULE,
  },
  payQr: { width: 52, height: 52, marginRight: 10 },
  payLabel: { fontSize: 7.5, color: MUTED, letterSpacing: 0.5 },
  payValue: { fontSize: 9, fontWeight: 700, marginTop: 2 },
  notes: { fontSize: 8, color: MUTED, lineHeight: 1.3 },
  footer: { alignItems: "center" },
  footerText: { fontSize: 8, color: MUTED, textAlign: "center" },
  // Height derived from the asset's own 381x210 so the mark is never squashed.
  nexivoLogo: {
    width: 54,
    height: (54 * 210) / 381,
    marginTop: 6,
  },
  // Deliberately quieter than the thank-you line above it: the customer's eye
  // should land on the shop, not on whoever built the system.
  builtBy: {
    fontSize: 7,
    color: "#909090",
    textAlign: "center",
    marginTop: 3,
    letterSpacing: 0.3,
  },
});

const statusLabel: Record<string, string> = {
  RECEIVED: "Received",
  READY: "Ready",
  DELIVERED: "Delivered",
};

function getExpectedDelivery(createdAt: Date | string) {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + 5);
  return date;
}

function shortDate(value: Date) {
  return value.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

// Split out from the Page so the height estimator can be calibrated against a
// real render (scripts/check-receipt-height.mjs) instead of being eyeballed.
export function ReceiptBody({
  booking,
  shopName,
}: {
  booking: SerializedBooking;
  shopName: string;
}) {
  const expectedDelivery = getExpectedDelivery(booking.createdAt);
  const created = new Date(booking.createdAt);

  return (
    <>
        <View style={styles.header}>
          <Image style={styles.logo} src={LOGO_BUFFER} />
          <Text style={styles.shopName}>{shopName.toUpperCase()}</Text>
          <Text style={styles.receiptLine}>
            RECEIPT #{booking.bookingCode} &middot;{" "}
            {(statusLabel[booking.status] ?? booking.status).toUpperCase()}
          </Text>
          {SHOP_CONTACTS.map((contact) => (
            <Text key={contact.label} style={styles.contactLine}>
              {contact.label}
            </Text>
          ))}
        </View>

        <View style={styles.rule} />

        <MetaRow label="Customer" value={booking.customerName} />
        <MetaRow label="Phone" value={booking.phone} />
        <MetaRow label="Received" value={shortDate(created)} />
        <MetaRow label="Booking #" value={booking.bookingCode} />
        <MetaRow label="Expected" value={shortDate(expectedDelivery)} />

        <View style={styles.rule} />

        <View style={styles.tableHead}>
          <Text style={[styles.colItem, styles.headText]}>ITEM</Text>
          <Text style={[styles.colAmount, styles.headText]}>AMOUNT</Text>
        </View>

        {booking.items.map((item) => (
          <View style={styles.itemRow} key={item.id}>
            <View style={styles.colItem}>
              <Text style={styles.itemName}>{item.itemName}</Text>
              <Text style={styles.itemBreak}>
                {item.quantity} &times; {item.unitPrice.toFixed(2)}
              </Text>
            </View>
            <Text style={[styles.colAmount, styles.itemName]}>
              {item.lineTotal.toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.rule} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>
            {booking.totalAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.payBox}>
          <Image style={styles.payQr} src={QR_CODE_BUFFER} />
          <View>
            <Text style={styles.payLabel}>SCAN TO PAY</Text>
            <Text style={styles.payValue}>Meezan Bank</Text>
          </View>
        </View>

        {booking.notes && (
          <>
            <View style={styles.rule} />
            <Text style={styles.notes}>Notes: {booking.notes}</Text>
          </>
        )}

        <View style={styles.rule} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing {shopName}!
          </Text>
          <Image style={styles.nexivoLogo} src={NEXIVO_BUFFER} />
          <Text style={styles.builtBy}>System by NexivoStudio.io</Text>
        </View>
    </>
  );
}

export function ReceiptDocument({
  booking,
  shopName,
}: {
  booking: SerializedBooking;
  shopName: string;
}) {
  return (
    <Document>
      <Page size={[PAGE_WIDTH, estimateHeight(booking)]} style={styles.page}>
        <ReceiptBody booking={booking} shopName={shopName} />
      </Page>
    </Document>
  );
}
