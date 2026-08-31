"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PriceBundle, PriceItem } from "@/lib/price-list";
import { BASKET_STORAGE_KEY, type BasketLine } from "@/lib/basket";

/**
 * The bill calculator: tap things in, watch the total, then carry the list
 * over to the pickup form.
 *
 * Every price here is the shop's own, read from the same table the counter
 * bills from, so a quote on the website and a bill at the counter cannot
 * disagree. Nothing is a "starting from" figure.
 */

type Entry = {
  key: string;
  name: string;
  price: number;
  /** Sets are listed apart, and say what they are made of. */
  detail?: string;
};

function stepperLabel(name: string, direction: "more" | "fewer") {
  return direction === "more" ? `Add one ${name}` : `Remove one ${name}`;
}

export default function Calculator({
  items,
  bundles,
}: {
  items: PriceItem[];
  bundles: PriceBundle[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const garments: Entry[] = useMemo(
    () => items.map((item) => ({ key: item.id, name: item.name, price: item.price })),
    [items]
  );

  const sets: Entry[] = useMemo(
    () =>
      bundles.map((bundle) => ({
        key: bundle.id,
        name: bundle.name,
        price: bundle.total,
        detail: bundle.parts
          .map((part) =>
            part.quantity > 1 ? `${part.quantity} × ${part.name}` : part.name
          )
          .join(" + "),
      })),
    [bundles]
  );

  const needle = query.trim().toLowerCase();
  const matches = (entry: Entry) =>
    needle === "" ||
    entry.name.toLowerCase().includes(needle) ||
    (entry.detail?.toLowerCase().includes(needle) ?? false);

  const shownGarments = garments.filter(matches);
  const shownSets = sets.filter(matches);
  const nothingFound = shownGarments.length === 0 && shownSets.length === 0;

  const byKey = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const entry of [...garments, ...sets]) map.set(entry.key, entry);
    return map;
  }, [garments, sets]);

  const lines = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([key, quantity]) => ({ entry: byKey.get(key)!, quantity }))
    .filter((line) => line.entry !== undefined);

  const total = lines.reduce(
    (sum, line) => sum + line.entry.price * line.quantity,
    0
  );
  const pieces = lines.reduce((sum, line) => sum + line.quantity, 0);

  function change(key: string, delta: number) {
    setQuantities((current) => {
      const next = Math.max(0, (current[key] ?? 0) + delta);
      const copy = { ...current };
      if (next === 0) delete copy[key];
      else copy[key] = next;
      return copy;
    });
  }

  function requestPickup() {
    const basket: BasketLine[] = lines.map((line) => ({
      name: line.entry.name,
      unitPrice: line.entry.price,
      quantity: line.quantity,
    }));
    try {
      // sessionStorage rather than the URL: a fifty-line basket does not belong
      // in a query string, and the next page is one tab away, not a link the
      // customer sends to anyone.
      sessionStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket));
    } catch {
      // Private browsing, or storage turned off. The form still works; it just
      // opens empty, which is better than refusing to go there at all.
    }
    router.push("/book");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <div>
        <label htmlFor="item-search" className="sr-only">
          Search the price list
        </label>
        <input
          id="item-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search — shirt, curtains, bedsheet…"
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        {nothingFound ? (
          <p className="mt-10 rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
            Nothing on the list matches “{query.trim()}”. We still take things
            that are not listed — ask us for a price.
          </p>
        ) : (
          <>
            {shownGarments.length > 0 && (
              <EntryList
                heading="Per garment"
                entries={shownGarments}
                quantities={quantities}
                onChange={change}
              />
            )}
            {shownSets.length > 0 && (
              <EntryList
                heading="Sets"
                entries={shownSets}
                quantities={quantities}
                onChange={change}
              />
            )}
          </>
        )}
      </div>

      {/* The running total, shaped like the ticket it will become. */}
      <div
        className="rounded-xl border border-border bg-card lg:sticky lg:top-24"
        style={{ "--notch-bg": "var(--background)" } as React.CSSProperties}
      >
        <div className="px-6 pt-6 pb-5">
          <p className="font-display text-sm font-extrabold tracking-[0.16em] uppercase">
            Your estimate
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pieces === 0
              ? "Nothing added yet"
              : `${pieces} ${pieces === 1 ? "piece" : "pieces"}`}
          </p>
        </div>

        <div className="ticket-tear" />

        {lines.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Add what you are sending and the total builds up here.
          </p>
        ) : (
          <ul className="grid gap-2.5 px-6 py-6 text-sm">
            {lines.map((line) => (
              <li key={line.entry.key} className="flex items-baseline gap-2">
                <span className="font-mono text-muted-foreground tabular-nums">
                  {line.quantity}×
                </span>
                <span className="min-w-0">{line.entry.name}</span>
                <span className="leader" aria-hidden="true" />
                <span className="font-mono tabular-nums">
                  {(line.entry.price * line.quantity).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border px-6 py-5">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-sm font-extrabold tracking-[0.16em] uppercase">
              Total
            </span>
            <span className="font-mono text-2xl tabular-nums">
              Rs {total.toLocaleString()}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            An estimate from the shop&apos;s own price list. The bill is counted
            at the counter, so an item more or less will move it.
          </p>

          <button
            type="button"
            onClick={requestPickup}
            disabled={lines.length === 0}
            className="mt-5 w-full rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Request a pickup with this list
          </button>
        </div>
      </div>
    </div>
  );
}

function EntryList({
  heading,
  entries,
  quantities,
  onChange,
}: {
  heading: string;
  entries: Entry[];
  quantities: Record<string, number>;
  onChange: (key: string, delta: number) => void;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-sm font-extrabold tracking-[0.16em] text-muted-foreground uppercase">
        {heading}
      </h2>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {entries.map((entry) => {
          const quantity = quantities[entry.key] ?? 0;
          return (
            <li
              key={entry.key}
              className="flex items-center gap-4 py-3"
              data-active={quantity > 0 ? "" : undefined}
            >
              <div className="min-w-0 flex-1">
                <p className={quantity > 0 ? "font-medium" : undefined}>
                  {entry.name}
                </p>
                {entry.detail && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {entry.detail}
                  </p>
                )}
              </div>

              <span className="font-mono text-sm tabular-nums">
                {entry.price.toLocaleString()}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange(entry.key, -1)}
                  disabled={quantity === 0}
                  aria-label={stepperLabel(entry.name, "fewer")}
                  className="size-8 rounded-lg border border-border text-lg leading-none transition-colors hover:bg-muted disabled:opacity-30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  −
                </button>
                <span
                  className="w-6 text-center font-mono text-sm tabular-nums"
                  aria-live="polite"
                  aria-label={`${entry.name}: ${quantity}`}
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(entry.key, 1)}
                  aria-label={stepperLabel(entry.name, "more")}
                  className="size-8 rounded-lg border border-border text-lg leading-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
