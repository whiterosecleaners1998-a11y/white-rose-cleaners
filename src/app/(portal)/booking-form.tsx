"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  CircleCheck,
  Search,
  X,
  Trash2,
  MessageCircle,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buildWhatsAppLink } from "@/lib/whatsapp-link";
import { openReceiptPdf, isPrintShortcut } from "@/lib/print-receipt";

type PriceItem = {
  id: string;
  name: string;
  price: number;
};

type BundleLine = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
};

type Bundle = {
  id: string;
  name: string;
  items: BundleLine[];
};

type CartLine = {
  id: string;
  quantity: number;
};

// Keys 1-9 then 0 address the first ten items on screen, so the operator can
// book a whole order from the number row without reaching for the mouse.
// Position follows the price list's own order (sortOrder, then name), so the
// digits stay put unless the Price List page is reordered.
const SHORTCUT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

// Bundles take home-row letters so they never fight the item digits, which
// means both tabs stay reachable from the keyboard without switching tabs.
const BUNDLE_KEYS = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];

// "1", or "1-9" — never advertises a key that has nothing behind it.
function keyRange(keys: string[], count: number): string | null {
  const usable = Math.min(count, keys.length);
  if (usable === 0) return null;
  return usable === 1 ? keys[0] : `${keys[0]}-${keys[usable - 1]}`;
}

function EmptyPane({
  search,
  noun,
  otherCount,
  otherNoun,
  onSwitch,
}: {
  search: string;
  noun: string;
  otherCount: number;
  otherNoun: string;
  onSwitch: () => void;
}) {
  const term = search.trim();
  return (
    <div className="flex min-h-20 flex-col items-center justify-center gap-1 px-3 py-6 text-center">
      <p className="text-sm text-muted-foreground">
        {term ? `No ${noun} matches "${term}".` : `No ${noun}s yet.`}
      </p>
      {term && otherCount > 0 && (
        <button
          type="button"
          onClick={onSwitch}
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          {otherCount} matching {otherNoun}
          {otherCount === 1 ? "" : "s"} — show {otherNoun}s
        </button>
      )}
    </div>
  );
}

export default function BookingForm({
  priceList,
  bundles = [],
}: {
  priceList: PriceItem[];
  bundles?: Bundle[];
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"items" | "bundles">("items");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    totalAmount: number;
    customerName: string;
    phone: string;
    bookingCode: string;
  } | null>(null);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return priceList;
    return priceList.filter((item) => item.name.toLowerCase().includes(term));
  }, [priceList, search]);

  // "1", or "1-9" — only as wide as the items currently on screen.
  const shortcutRange = useMemo(
    () => keyRange(SHORTCUT_KEYS, visibleItems.length),
    [visibleItems.length],
  );

  const quantityById = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of cart) map.set(line.id, line.quantity);
    return map;
  }, [cart]);

  const lines = useMemo(
    () =>
      cart
        .map((line) => {
          const item = priceList.find((p) => p.id === line.id);
          return item ? { ...item, quantity: line.quantity } : null;
        })
        .filter((line): line is PriceItem & { quantity: number } =>
          Boolean(line && line.quantity > 0),
        ),
    [cart, priceList],
  );

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines],
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  // A bundle whose items were all removed from the price list would be a button
  // that does nothing, so it is not offered.
  const usableBundles = useMemo(
    () => bundles.filter((bundle) => bundle.items.length > 0),
    [bundles],
  );

  // Search narrows both tabs at once — matching a bundle by its own name or by
  // anything inside it — so the letter and digit keys stay usable from either
  // tab without switching.
  const visibleBundles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return usableBundles;
    return usableBundles.filter(
      (bundle) =>
        bundle.name.toLowerCase().includes(term) ||
        bundle.items.some((line) => line.name.toLowerCase().includes(term)),
    );
  }, [usableBundles, search]);

  const bundleRange = useMemo(
    () => keyRange(BUNDLE_KEYS, visibleBundles.length),
    [visibleBundles.length],
  );

  const addOne = useCallback((item: PriceItem) => {
    setError(null);
    setCart((prev) =>
      prev.some((line) => line.id === item.id)
        ? prev.map((line) =>
            line.id === item.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [...prev, { id: item.id, quantity: 1 }],
    );
  }, []);

  // One press drops every line of the bundle in, adding to whatever is already
  // in the cart rather than replacing it.
  const addBundle = useCallback((bundle: Bundle) => {
    setError(null);
    setCart((prev) => {
      const next = [...prev];
      for (const line of bundle.items) {
        const at = next.findIndex((cartLine) => cartLine.id === line.itemId);
        if (at === -1) {
          next.push({ id: line.itemId, quantity: line.quantity });
        } else {
          next[at] = {
            ...next[at],
            quantity: next[at].quantity + line.quantity,
          };
        }
      }
      return next;
    });
    toast.success(`Added ${bundle.name}`, {
      description: bundle.items
        .map((line) => `${line.quantity} × ${line.name}`)
        .join(", "),
    });
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (result || submitting) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        if (target.isContentEditable) return;
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
          // Typing a digit into a field must stay a digit. Escape steps out of
          // the field so the number row goes back to adding items.
          if (event.key === "Escape") target.blur();
          return;
        }
      }

      const key = event.key.toLowerCase();

      const bundleIndex = BUNDLE_KEYS.indexOf(key);
      const bundle =
        bundleIndex === -1 ? undefined : visibleBundles[bundleIndex];
      if (bundle) {
        event.preventDefault();
        addBundle(bundle);
        return;
      }

      const index = SHORTCUT_KEYS.indexOf(key);
      const item = index === -1 ? undefined : visibleItems[index];
      if (!item) return;
      event.preventDefault();
      addOne(item);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addBundle, addOne, result, submitting, visibleBundles, visibleItems]);

  // The item shortcuts above stand down once a booking is saved, which is
  // exactly when the operator wants the receipt. P takes over on that screen.
  // There is no receipt markup here to print, so this opens the PDF instead.
  useEffect(() => {
    if (!result) return;
    function onKeyDown(event: KeyboardEvent) {
      if (!isPrintShortcut(event)) return;
      event.preventDefault();
      openReceiptPdf(result!.id);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [result]);

  function setLineQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      removeLine(id);
      return;
    }
    setCart((prev) =>
      prev.map((line) => (line.id === id ? { ...line, quantity } : line)),
    );
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((line) => line.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError("Add at least one item.");
      return;
    }
    if (!customerName.trim() || !phone.trim()) {
      setError("Customer name and phone number are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          notes: notes || undefined,
          items: lines.map((line) => ({
            name: line.name,
            unitPrice: line.price,
            quantity: line.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save booking");
        return;
      }
      setResult({
        id: data.id,
        totalAmount: data.totalAmount,
        customerName: data.customerName,
        phone: data.phone,
        bookingCode: data.bookingCode,
      });
      toast.success("Booking saved");
      setCustomerName("");
      setPhone("");
      setNotes("");
      setCart([]);
      setSearch("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const ownerNumber = process.env.NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER;
    const ownerMessage = `New booking #${result.bookingCode}: ${result.customerName} (${result.phone}) — total ${result.totalAmount.toFixed(2)}.`;
    const customerMessage = `Hi ${result.customerName}, we've received your order #${result.bookingCode}. Total: ${result.totalAmount.toFixed(2)}. We'll message you as soon as it's ready for pickup.`;

    return (
      <Alert>
        <CircleCheck />
        <AlertTitle>
          Booking saved. Total amount: {result.totalAmount.toFixed(2)}
        </AlertTitle>
        <AlertDescription>
          Booking #{result.bookingCode} for {result.customerName}.
        </AlertDescription>
        {/* Alert lays its children out on a grid whose first column is sized
            for the icon; only AlertTitle/Description opt into column 2, so an
            extra child has to place itself there or it widens the icon column
            and shoves the text across the card. */}
        <div className="col-start-2 mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            render={
              <a
                href={buildWhatsAppLink(result.phone, customerMessage)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageCircle />
            Message Customer on WhatsApp
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openReceiptPdf(result.id)}
          >
            <Printer />
            Print{" "}
            <kbd className="ml-0.5 rounded border px-1 font-mono text-[0.7em]">
              P
            </kbd>
          </Button>
          <Button
            size="sm"
            variant="outline"
            render={<a href={`/bookings/${result.id}`} />}
          >
            View receipt
          </Button>
          {ownerNumber && (
            <Button
              size="sm"
              variant="outline"
              render={
                <a
                  href={buildWhatsAppLink(ownerNumber, ownerMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Notify Owner on WhatsApp
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setResult(null)}>
            New booking
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="customerName">Customer name</Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 1234567"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex rounded-lg border p-0.5">
            {(["items", "bundles"] as const).map((value) => {
              const count =
                value === "items" ? visibleItems.length : visibleBundles.length;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  data-active={tab === value || undefined}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground capitalize transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none data-active:bg-primary data-active:text-primary-foreground"
                >
                  {value}{" "}
                  <span className="tabular-nums opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="itemSearch"
              value={search}
              autoComplete="off"
              placeholder="Search"
              className="h-9 pl-9"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                // Enter inside a form submits it — here it should add the top
                // match instead, so the operator never leaves the search box.
                e.preventDefault();
                const top =
                  tab === "items" ? visibleItems[0] : visibleBundles[0];
                if (!top) return;
                if (tab === "items") {
                  addOne(top as PriceItem);
                } else {
                  addBundle(top as Bundle);
                }
                setSearch("");
              }}
            />
          </div>
        </div>

        {/* Fixed height regardless of catalogue size, so the cart never moves
            down the page as items and bundles are added over time. */}
        <div className="max-h-56 min-h-24 overflow-y-auto rounded-lg border bg-muted/20 p-2">
          {tab === "items" ? (
            visibleItems.length === 0 ? (
              <EmptyPane
                search={search}
                noun="item"
                otherCount={visibleBundles.length}
                otherNoun="bundle"
                onSwitch={() => setTab("bundles")}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleItems.map((item, index) => {
                  const inCart = quantityById.get(item.id) ?? 0;
                  const shortcut = SHORTCUT_KEYS[index];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addOne(item)}
                      data-in-cart={inCart > 0 || undefined}
                      aria-keyshortcuts={shortcut}
                      title={
                        shortcut
                          ? `Press ${shortcut} to add ${item.name}`
                          : undefined
                      }
                      className="relative flex min-h-20 flex-col justify-between rounded-lg border bg-card p-3 text-left transition-colors select-none hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98] data-in-cart:border-primary data-in-cart:bg-primary/5"
                    >
                      {inCart > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums">
                          {inCart}
                        </span>
                      )}
                      <span className="pr-7 text-sm leading-tight font-medium break-words">
                        {item.name}
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {item.price.toFixed(2)}
                        </span>
                        {shortcut && (
                          <kbd
                            aria-hidden="true"
                            className="flex size-5 items-center justify-center rounded border bg-muted font-mono text-[11px] leading-none font-medium text-muted-foreground tabular-nums"
                          >
                            {shortcut}
                          </kbd>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : visibleBundles.length === 0 ? (
            <EmptyPane
              search={search}
              noun="bundle"
              otherCount={visibleItems.length}
              otherNoun="item"
              onSwitch={() => setTab("items")}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {visibleBundles.map((bundle, index) => {
                const shortcut = BUNDLE_KEYS[index];
                const bundleTotal = bundle.items.reduce(
                  (sum, line) => sum + line.price * line.quantity,
                  0,
                );
                return (
                  <button
                    key={bundle.id}
                    type="button"
                    onClick={() => addBundle(bundle)}
                    aria-keyshortcuts={shortcut}
                    title={
                      shortcut
                        ? `Press ${shortcut} to add ${bundle.name}`
                        : undefined
                    }
                    className="flex min-h-20 flex-col justify-between rounded-lg border border-primary/30 bg-primary/5 p-3 text-left transition-colors select-none hover:border-primary hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98]"
                  >
                    <span className="text-sm leading-tight font-semibold break-words">
                      {bundle.name}
                    </span>
                    <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {bundle.items
                        .map((line) => `${line.quantity} × ${line.name}`)
                        .join(", ")}
                    </span>
                    <span className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {bundleTotal.toFixed(2)}
                      </span>
                      {shortcut && (
                        <kbd
                          aria-hidden="true"
                          className="flex size-5 items-center justify-center rounded border bg-background font-mono text-[11px] leading-none font-medium text-muted-foreground uppercase"
                        >
                          {shortcut}
                        </kbd>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {(shortcutRange || bundleRange) && (
          <p className="text-xs text-muted-foreground">
            Press{" "}
            {shortcutRange && (
              <>
                <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">
                  {shortcutRange}
                </kbd>{" "}
                for an item
              </>
            )}
            {shortcutRange && bundleRange && ", or "}
            {bundleRange && (
              <>
                <kbd className="rounded border bg-muted px-1 font-mono text-[11px] uppercase">
                  {bundleRange}
                </kbd>{" "}
                for a bundle
              </>
            )}
            {
              " — either tab, no need to switch. While typing in a field, press "
            }
            <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">
              Esc
            </kbd>{" "}
            first.
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label>
            Cart
            {itemCount > 0 && (
              <span className="ml-1 font-normal text-muted-foreground">
                ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
            )}
          </Label>
          {lines.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCart([])}
            >
              <Trash2 />
              Clear
            </Button>
          )}
        </div>

        {lines.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            Cart is empty. Tap an item above to add it.
          </p>
        ) : (
          <div className="divide-y rounded-lg border">
            {lines.map((line) => (
              <div
                key={line.id}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Decrease ${line.name}`}
                    onClick={() => setLineQuantity(line.id, line.quantity - 1)}
                  >
                    <Minus />
                  </Button>
                  <Input
                    aria-label={`Quantity of ${line.name}`}
                    type="number"
                    min={0}
                    value={line.quantity}
                    onChange={(e) =>
                      setLineQuantity(line.id, Number(e.target.value) || 0)
                    }
                    className="w-14 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Increase ${line.name}`}
                    onClick={() => setLineQuantity(line.id, line.quantity + 1)}
                  >
                    <Plus />
                  </Button>
                  <p className="w-20 text-right text-sm font-medium tabular-nums">
                    {(line.price * line.quantity).toFixed(2)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${line.name}`}
                    onClick={() => removeLine(line.id)}
                  >
                    <X />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-semibold">Total: {total.toFixed(2)}</p>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? "Saving..." : "Save Booking & Notify"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
