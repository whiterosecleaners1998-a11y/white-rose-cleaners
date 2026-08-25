// Calibration harness for the receipt height estimator.
//
// The receipt is printed on an 80mm roll, so the page height is computed from
// the content rather than fixed. This binary-searches the true minimum height
// that still renders on ONE page for a spread of realistic bookings, and
// compares it against estimateHeight(). Run with: npx tsx scripts/check-receipt-height.mjs
//
//   shortfall < 0  => estimate is too small, content spills to a second page
//   slack          => wasted paper at the bottom of the cut
import React from "react";
import { Document, Page, renderToBuffer, StyleSheet } from "@react-pdf/renderer";
import { ReceiptBody, estimateHeight } from "../src/lib/receipt-pdf.tsx";

const PAGE_WIDTH = 226.77;
const probe = StyleSheet.create({
  page: { fontSize: 8.5, fontFamily: "Helvetica", color: "#000000", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 },
});

const SHOP = "White Rose Cleaner";

function pageCount(buf) {
  return (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
}

async function fitsOnePage(booking, height) {
  const buf = await renderToBuffer(
    React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: [PAGE_WIDTH, height], style: probe.page },
        React.createElement(ReceiptBody, { booking, shopName: SHOP })
      )
    )
  );
  return pageCount(buf) === 1;
}

async function minHeight(booking) {
  let lo = 100, hi = 2400;
  if (!(await fitsOnePage(booking, hi))) return null;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (await fitsOnePage(booking, mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

const SHORT = "Shirt";
const LONG = "Three Piece Suit - Dry Clean and Press";
// Long enough to wrap. Cases built only from names that fit on one line are
// what let a wrapping bug through: the estimator's wrap terms never ran.
const WRAPPING = "Curtains per Panel (Heavy Lined, Velvet) - Dry Clean Only";
const LONG_NAME = "Muhammad Sabih Ul Ebad Khan S/O Abdul Rehman Khan";
const LONG_NOTE = "Kindly ensure the embroidered dupatta receives delicate handling throughout, particularly around the sequinned borders, and please telephone beforehand.";

function booking({ n, name = SHORT, notes = null, paidAmount = 0, customerName = "Muhammad Sabih Ul Ebad" }) {
  return {
    id: "x", bookingCode: "WRD-00009",
    customerName,
    phone: "03001234567", status: "RECEIVED",
    totalAmount: 385 * n, notes,
    paidAmount, remainingAmount: 385 * n - paidAmount,
    createdAt: new Date("2026-08-24T10:00:00Z"),
    items: Array.from({ length: n }, (_, i) => ({
      id: "i" + i, itemName: name, unitPrice: 385,
      quantity: i + 1, lineTotal: 385 * (i + 1),
    })),
  };
}

const CASES = [
  ["1 short", booking({ n: 1 })],
  ["3 short", booking({ n: 3 })],
  ["8 short", booking({ n: 8 })],
  ["20 short", booking({ n: 20 })],
  ["40 short", booking({ n: 40 })],
  ["1 long", booking({ n: 1, name: LONG })],
  ["8 long", booking({ n: 8, name: LONG })],
  ["20 long", booking({ n: 20, name: LONG })],
  ["8 short part-paid", booking({ n: 8, paidAmount: 500 })],
  ["8 short + notes", booking({ n: 8, notes: "Handle the silk scarf gently and use extra starch on the collars please." })],
  ["20 long + notes", booking({ n: 20, name: LONG, notes: "Handle the silk scarf gently and use extra starch on the collars please. Ring before delivery." })],
  ["1 wrapping", booking({ n: 1, name: WRAPPING })],
  ["8 wrapping", booking({ n: 8, name: WRAPPING })],
  ["20 wrapping", booking({ n: 20, name: WRAPPING })],
  ["long name", booking({ n: 1, customerName: LONG_NAME })],
  ["long name + 8 short", booking({ n: 8, customerName: LONG_NAME })],
  ["long note", booking({ n: 1, notes: LONG_NOTE })],
  ["long note twice", booking({ n: 1, notes: LONG_NOTE + " " + LONG_NOTE })],
  ["long name + long note", booking({ n: 1, customerName: LONG_NAME, notes: LONG_NOTE })],
  ["everything long", booking({ n: 12, name: WRAPPING, customerName: LONG_NAME, notes: LONG_NOTE, paidAmount: 500 })],
];

let worstShortfall = 0, worstSlack = 0, failures = 0;
console.log("case                 estimate   actual    diff");
console.log("-".repeat(50));
for (const [label, b] of CASES) {
  const est = estimateHeight(b);
  const act = await minHeight(b);
  if (act === null) { console.log(`${label.padEnd(20)} ${String(est).padStart(8)}   OVERFLOW`); failures++; continue; }
  const diff = est - act;
  if (diff < worstShortfall) worstShortfall = diff;
  if (diff > worstSlack) worstSlack = diff;
  const flag = diff < 0 ? "  <-- SPILLS" : "";
  console.log(`${label.padEnd(20)} ${String(est).padStart(8)} ${String(act).padStart(8)} ${String(diff).padStart(7)}${flag}`);
  if (diff < 0) failures++;
}
console.log("-".repeat(50));
console.log(`worst shortfall: ${worstShortfall}pt   worst slack: ${worstSlack}pt`);
process.exit(failures ? 1 : 0);
