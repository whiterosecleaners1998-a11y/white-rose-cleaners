"use client";

import { useRef, useState } from "react";
import type { LaundryPackage } from "@/lib/packages";

/**
 * The package tiers and the enquiry that goes with them.
 *
 * Choosing a tier does not buy anything — it sends the shop a note saying who
 * is interested in which one. There is no customer account to bill against and
 * no piece balance to draw down, so pretending this is a checkout would be a
 * lie the counter has to sort out later.
 */
export default function PackagesClient({
  packages,
}: {
  packages: LaundryPackage[];
}) {
  const [chosen, setChosen] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function choose(name: string) {
    setChosen(name);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSending(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      kind: "PACKAGE" as const,
      customerName: String(form.get("customerName") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      packageName: chosen || undefined,
      note: String(form.get("note") ?? "").trim() || undefined,
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError("That did not go through. Please try again, or call the shop.");
        setSending(false);
        return;
      }
      setSent(true);
    } catch {
      setError("We could not reach the shop just now. Please try again.");
      setSending(false);
    }
  }

  return (
    <>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((item) => (
          <li
            key={item.pieces}
            className={`flex flex-col rounded-xl border bg-card p-6 ${
              item.featured
                ? "border-primary ring-1 ring-primary"
                : "border-border"
            }`}
          >
            {item.featured && (
              <p className="font-mono text-[0.68rem] tracking-[0.18em] text-brand-ember uppercase">
                Most taken
              </p>
            )}
            <p className="font-display mt-1 text-4xl font-extrabold tracking-tight tabular-nums">
              {item.pieces}
            </p>
            <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Pieces
            </p>

            <p className="mt-5 font-mono text-2xl tabular-nums">
              Rs {item.price.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Rs {item.perPiece.toLocaleString()} a piece
            </p>

            <button
              type="button"
              onClick={() => choose(`${item.pieces} pieces`)}
              className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
                item.featured
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-muted"
              }`}
            >
              Ask about this
            </button>
          </li>
        ))}
      </ul>

      <div ref={formRef} className="mt-16 max-w-lg scroll-mt-24">
        {sent ? (
          <div className="rounded-xl border border-border bg-card px-7 py-10 text-center">
            <p className="font-display text-sm font-extrabold tracking-[0.16em] text-brand-ember uppercase">
              Noted
            </p>
            <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight">
              We&apos;ll be in touch
            </h2>
            <p className="mt-3 text-muted-foreground">
              Someone from the shop will call to talk the package through and
              set it up.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-[clamp(1.4rem,2.4vw,1.8rem)] font-extrabold tracking-tight uppercase">
              Ask about a package
            </h2>
            <p className="mt-3 text-muted-foreground">
              Leave your name and number and we will call you back to set it up.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
              <div className="grid gap-1.5">
                <label htmlFor="package" className="text-sm font-medium">
                  Which package?
                </label>
                <select
                  id="package"
                  value={chosen}
                  onChange={(event) => setChosen(event.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Not sure yet</option>
                  {packages.map((item) => (
                    <option key={item.pieces} value={`${item.pieces} pieces`}>
                      {item.pieces} pieces — Rs {item.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor="customerName" className="text-sm font-medium">
                    Your name
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    required
                    autoComplete="name"
                    className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    autoComplete="tel"
                    placeholder="0300 1234567"
                    className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="note" className="text-sm font-medium">
                  Anything to add?
                  <span className="ml-2 font-normal text-muted-foreground">
                    Optional
                  </span>
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="justify-self-start rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity disabled:opacity-50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {sending ? "Sending…" : "Ask us to call"}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
