/**
 * Printing helpers for booking receipts.
 *
 * The receipt people actually want is the server-rendered 80mm PDF, so both the
 * P shortcut and the Print button open that.
 *
 * Two things that were tried and should not come back: loading the PDF into an
 * offscreen iframe and calling print() on it (Chrome often does not fire `load`
 * for an embedded PDF, and print() on the plugin document can be a no-op that
 * throws nothing, so the shortcut silently did nothing), and window.print(),
 * which prints the web page rather than the PDF receipt.
 */

/**
 * Opens the print dialog for the 80mm receipt rendered on the booking page.
 *
 * The @page size is injected only for the duration of the print, because a page
 * rule cannot be scoped by selector and a permanent 80mm default would apply to
 * every other page in the app too.
 */
export function printReceiptSheet(): void {
  if (typeof window === "undefined") return;

  const style = document.createElement("style");
  style.setAttribute("data-receipt-page", "");
  style.textContent = `@page { ${receiptPageSize()} margin: 0; }`;
  document.head.appendChild(style);

  let done = false;
  function cleanup() {
    if (done) return;
    done = true;
    style.remove();
    window.removeEventListener("afterprint", cleanup);
  }
  window.addEventListener("afterprint", cleanup);
  // Not every browser fires afterprint; do not leave the rule behind.
  window.setTimeout(cleanup, 60_000);

  window.print();
}

/**
 * `size` on @page takes keywords or one-to-two lengths — never a length mixed
 * with `auto`, which is why an earlier `size: 80mm auto` was dropped whole and
 * the receipt printed on a full sheet. The roll has no fixed height, so the
 * sheet is measured and its height passed through as a concrete value.
 */
function receiptPageSize(): string {
  const sheet = document.getElementById("receipt-sheet");
  if (!sheet) return "";
  const px = sheet.getBoundingClientRect().height;
  if (px < 20) return ""; // not laid out yet — let the printer decide
  const mm = Math.ceil((px * 25.4) / 96) + 1; // +1mm so nothing tips over
  return `size: 80mm ${mm}mm;`;
}

/**
 * Opens the server-rendered PDF receipt in a new tab. Used where the receipt is
 * not on screen to be printed — after saving a booking, for instance.
 */
export function openReceiptPdf(bookingId: string): void {
  if (typeof window === "undefined") return;
  window.open(
    `/api/bookings/${bookingId}/pdf?inline=1`,
    "_blank",
    "noopener,noreferrer"
  );
}

/**
 * True when a bare "p" keypress should be treated as the print shortcut — the
 * operator is not typing into a field and is not holding a modifier, so Ctrl+P
 * still belongs to the browser.
 */
export function isPrintShortcut(event: KeyboardEvent): boolean {
  if (event.key.toLowerCase() !== "p") return false;
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (event.repeat) return false;

  const target = event.target as HTMLElement | null;
  if (target) {
    if (target.isContentEditable) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return false;
    // The status dropdown is a Base UI listbox rendered as a button, so it
    // slips past the tag check — and it uses letter keys for its own
    // typeahead. While its trigger is open, P belongs to it.
    if (target.closest('[aria-expanded="true"]')) return false;
  }

  return true;
}
