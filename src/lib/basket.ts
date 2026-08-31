/**
 * The basket the bill calculator hands to the pickup form.
 *
 * It lives in sessionStorage for the one hop between the two pages: it is not
 * an order, nobody has agreed to it, and it should not outlive the tab. The
 * shape is deliberately the same as the API's item schema so the form can post
 * it on without reshaping anything.
 */

export const BASKET_STORAGE_KEY = "wr-basket";

export type BasketLine = {
  name: string;
  unitPrice: number;
  quantity: number;
};

/**
 * One shared empty array rather than a fresh [] each time.
 *
 * useSyncExternalStore compares snapshots by identity and re-renders whenever
 * it gets a new one, so a function that returns a new empty array on every call
 * would loop forever.
 */
const EMPTY: BasketLine[] = [];

/** Last raw string parsed, and what it parsed to, for the same reason. */
let cache: { raw: string | null; value: BasketLine[] } = {
  raw: null,
  value: EMPTY,
};

function parse(raw: string | null): BasketLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    const lines = parsed.flatMap((line): BasketLine[] => {
      if (typeof line !== "object" || line === null) return [];
      const { name, unitPrice, quantity } = line as Record<string, unknown>;
      if (typeof name !== "string" || name === "") return [];
      if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice)) return [];
      if (typeof quantity !== "number" || !Number.isInteger(quantity)) return [];
      if (quantity < 1) return [];
      return [{ name, unitPrice, quantity }];
    });

    return lines.length > 0 ? lines : EMPTY;
  } catch {
    return EMPTY;
  }
}

/**
 * What is in storage right now, stable between calls while it has not changed.
 * Never throws: private browsing and blocked storage both read as empty.
 */
export function basketSnapshot(): BasketLine[] {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(BASKET_STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (raw === cache.raw) return cache.value;
  cache = { raw, value: parse(raw) };
  return cache.value;
}

/** There is no sessionStorage on the server, so the first paint has no basket. */
export function basketServerSnapshot(): BasketLine[] {
  return EMPTY;
}

/**
 * Nothing in this tab rewrites the basket while the form is open — the
 * calculator is a page away — so this only listens for another tab clearing it.
 */
export function subscribeToBasket(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function clearBasket() {
  try {
    sessionStorage.removeItem(BASKET_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage was never available.
  }
  cache = { raw: null, value: EMPTY };
}

export function basketTotal(lines: BasketLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}
