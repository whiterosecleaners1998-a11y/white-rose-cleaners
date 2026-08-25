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
import { PAYMENT_METHODS } from "@/lib/receipt-data";

const LOGO_BUFFER = fs.readFileSync(
  path.join(process.cwd(), "public", "white-rose-logo.png")
);
const NEXIVO_BUFFER = fs.readFileSync(
  path.join(process.cwd(), "public", "nexivo-studio.png")
);
// Read once at module load, the same way the logos are: the codes never change
// between requests, and a receipt should not wait on the disk to be drawn.
const PAY_QR_BUFFERS = Object.fromEntries(
  PAYMENT_METHODS.map((method) => [
    method.key,
    fs.readFileSync(
      path.join(process.cwd(), "public", `pay-${method.key}.png`)
    ),
  ])
);

type SerializedBooking = {
  id: string;
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

// 80mm thermal roll: 226.77pt wide, of which roughly 203pt is printable once
// the dead margin at each edge is taken off. That printable width is exactly
// the column the reference receipt uses, so this is built to the same measure.
const PAGE_WIDTH = 226.77;
const PADDING_X = 12;
const CONTENT_WIDTH = PAGE_WIDTH - PADDING_X * 2;

const RULE = "#dedede";
const HAIRLINE = "#bdbdbd";
const INK = "#000000";
const MUTED = "#5c5c5c";
// Light enough that a thermal head barely registers it, so the summary block
// still reads as a block on paper without printing a grey slab.
const WASH = "#f4f4f4";

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
const BASE_HEIGHT = 548; // all but the contacts, Paid line, item rows and notes
const CONTACT_LINE = 10.5;
const PAID_ROW = 14.5; // the Paid line, printed only once money has changed hands
const ITEM_ROW = 25.6;
const EXTRA_LINE = 11;
const NOTES_BLOCK = 36; // label + first line

// The first line of a cell fits more than the ones under it, so they are
// counted separately; a single average would either spill or waste paper.
const ITEM_FIRST_LINE = 43;
const ITEM_WRAP_LINE = 33;
const NOTE_FIRST_LINE = 55;
const NOTE_WRAP_LINE = 56;
// Meta values are right-aligned into 62% of the column at 8.5pt bold, so a
// customer name much past this wraps onto a second line. Left out of the
// estimate originally, which is exactly how a long name pushed the tail of the
// receipt onto a second page.
const META_VALUE_LINE = 24;

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
  if (booking.paidAmount > 0) h += PAID_ROW;
  // Only the name and phone are free text; the dates cannot wrap.
  for (const value of [booking.customerName, booking.phone]) {
    h += (lineCount(value, META_VALUE_LINE, META_VALUE_LINE) - 1) * EXTRA_LINE;
  }
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
  // The asset is a full lockup — monogram, shop name and "since" line — so it
  // is printed large enough to be read as the name. Setting the shop name in
  // type underneath it only said the same thing twice.
  // Height derived from the asset's own 377x362 so the mark is never squashed.
  logo: { width: 84, height: (84 * 362) / 377 },
  contactLine: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 2.5,
    textAlign: "center",
  },
  contacts: { marginTop: 5, alignItems: "center" },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    marginVertical: 7,
  },

  // The booking number is what a customer reads out at the counter, so it gets
  // a frame of its own rather than a line among the other details.
  codeBand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  codeCaption: { fontSize: 6.5, color: MUTED, letterSpacing: 1 },
  codeValue: { fontSize: 13, fontWeight: 700, marginTop: 2 },
  statusChip: {
    borderWidth: 1,
    borderColor: INK,
    borderRadius: 2,
    paddingVertical: 2.5,
    paddingHorizontal: 5,
  },
  statusText: { fontSize: 7, fontWeight: 700, letterSpacing: 0.8 },

  sectionLabel: {
    fontSize: 6.5,
    color: MUTED,
    letterSpacing: 1.4,
    textAlign: "center",
    marginBottom: 5,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
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
    borderBottomColor: HAIRLINE,
    paddingBottom: 3,
    marginBottom: 5,
  },
  headText: { fontSize: 7, color: MUTED, letterSpacing: 1 },
  itemRow: { flexDirection: "row", marginBottom: 5 },
  // The reference splits its item table 73/27; the same ratio leaves the amount
  // column wide enough for a five-figure line without crowding item names.
  colItem: { width: "73%", paddingRight: 4 },
  colAmount: { width: "27%", textAlign: "right" },
  itemName: { fontSize: 8.5, lineHeight: 1.25 },
  itemBreak: { fontSize: 7.5, color: MUTED, marginTop: 1.5 },

  // Total, what has been paid and what is still owed belong together: read as
  // one block they answer the only question anyone asks the counter.
  summary: {
    backgroundColor: WASH,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 3,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 1 },
  totalValue: { fontSize: 14, fontWeight: 700 },
  paidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  paidLabel: { fontSize: 8, color: MUTED },
  paidValue: { fontSize: 8.5 },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
    marginVertical: 6,
  },
  balanceLabel: { fontSize: 8, fontWeight: 700, letterSpacing: 0.8 },
  balanceValue: { fontSize: 11, fontWeight: 700 },
  settledValue: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5 },

  payRow: { flexDirection: "row" },
  payCell: { width: "50%", alignItems: "center", paddingHorizontal: 2 },
  payQr: { width: 76, height: 76 },
  payProvider: { fontSize: 8, fontWeight: 700, marginTop: 5 },
  payHolder: { fontSize: 7.5, marginTop: 1.5 },
  payAccount: { fontSize: 7.5, color: MUTED, marginTop: 1 },

  notesLabel: { fontSize: 6.5, color: MUTED, letterSpacing: 1.4 },
  notes: { fontSize: 8, lineHeight: 1.3, marginTop: 3 },

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
  const settled = booking.remainingAmount <= 0;

  return (
    <>
      <View style={styles.header}>
        <Image style={styles.logo} src={LOGO_BUFFER} />
        <View style={styles.contacts}>
          {SHOP_CONTACTS.map((contact) => (
            <Text key={contact.label} style={styles.contactLine}>
              {contact.label}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.rule} />

      <View style={styles.codeBand}>
        <View>
          <Text style={styles.codeCaption}>RECEIPT</Text>
          <Text style={styles.codeValue}>{booking.bookingCode}</Text>
        </View>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>
            {(statusLabel[booking.status] ?? booking.status).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.rule} />

      <MetaRow label="Customer" value={booking.customerName} />
      <MetaRow label="Phone" value={booking.phone} />
      <MetaRow label="Received" value={shortDate(created)} />
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

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{booking.totalAmount.toFixed(2)}</Text>
        </View>

        {/* Only worth printing once money has changed hands. */}
        {booking.paidAmount > 0 && (
          <View style={styles.paidRow}>
            <Text style={styles.paidLabel}>Paid</Text>
            <Text style={styles.paidValue}>
              {booking.paidAmount.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.summaryDivider} />

        {/* The figure the counter is asked about first, so it closes the block
            in its own weight rather than sitting among the other details. */}
        <View style={styles.summaryRow}>
          <Text style={styles.balanceLabel}>
            {settled ? "BALANCE" : "BALANCE DUE"}
          </Text>
          <Text style={settled ? styles.settledValue : styles.balanceValue}>
            {settled ? "PAID IN FULL" : booking.remainingAmount.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.rule} />

      <Text style={styles.sectionLabel}>SCAN TO PAY</Text>
      <View style={styles.payRow}>
        {PAYMENT_METHODS.map((method) => (
          <View key={method.key} style={styles.payCell}>
            <Image style={styles.payQr} src={PAY_QR_BUFFERS[method.key]} />
            <Text style={styles.payProvider}>{method.provider}</Text>
            <Text style={styles.payHolder}>{method.holder}</Text>
            <Text style={styles.payAccount}>{method.account}</Text>
          </View>
        ))}
      </View>

      {booking.notes && (
        <>
          <View style={styles.rule} />
          <Text style={styles.notesLabel}>NOTES</Text>
          <Text style={styles.notes}>{booking.notes}</Text>
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

/**
 * `height` overrides the estimate. lib/receipt-file re-renders taller when a
 * receipt spills, and needs to be able to say how tall.
 */
export function ReceiptDocument({
  booking,
  shopName,
  height,
}: {
  booking: SerializedBooking;
  shopName: string;
  height?: number;
}) {
  return (
    <Document>
      <Page
        size={[PAGE_WIDTH, height ?? estimateHeight(booking)]}
        style={styles.page}
      >
        <ReceiptBody booking={booking} shopName={shopName} />
      </Page>
    </Document>
  );
}
