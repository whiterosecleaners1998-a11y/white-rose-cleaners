"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  basketServerSnapshot,
  basketSnapshot,
  basketTotal,
  clearBasket,
  subscribeToBasket,
} from "@/lib/basket";
import { pickupRequestMessage } from "@/lib/whatsapp-messages";

/**
 * The pickup form. Saves the request against the shop's database, then offers
 * to put it on the owner's phone as well.
 *
 * That second step is a wa.me link the customer taps, not a message the server
 * sends: the shop has no WhatsApp Business API, and the honest version of
 * "we'll tell the shop straight away" is a button that opens WhatsApp with the
 * request already typed. The request is saved either way, so nothing is lost if
 * they never tap it.
 */

type Props = {
  services: string[];
  slots: string[];
  minDate: string;
  maxDate: string;
  ownerWhatsApp: string;
};

type Sent = {
  message: string;
};

export default function BookForm({
  services,
  slots,
  minDate,
  maxDate,
  ownerWhatsApp,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);

  // sessionStorage is an external store and does not exist on the server, which
  // is exactly what useSyncExternalStore is for: the server snapshot is empty,
  // so the markup matches on both sides, and React swaps in the real basket
  // after hydration without an effect writing state on first render.
  const basket = useSyncExternalStore(
    subscribeToBasket,
    basketSnapshot,
    basketServerSnapshot
  );

  const total = basketTotal(basket);
  const pieces = basket.reduce((sum, line) => sum + line.quantity, 0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSending(true);

    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();

    const payload = {
      kind: "PICKUP" as const,
      customerName: value("customerName"),
      phone: value("phone"),
      email: value("email"),
      address: value("address"),
      preferredDate: value("preferredDate") || undefined,
      timeSlot: value("timeSlot") || undefined,
      serviceType: value("serviceType") || undefined,
      note: value("note") || undefined,
      items: basket,
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError(
          "That did not go through. Please check the form and try again, or call the shop."
        );
        setSending(false);
        return;
      }

      clearBasket();
      setSent({
        message: pickupRequestMessage({
          customerName: payload.customerName,
          phone: payload.phone,
          address: payload.address || undefined,
          preferredDate: payload.preferredDate,
          timeSlot: payload.timeSlot,
          serviceType: payload.serviceType,
          estimateTotal: total > 0 ? total : undefined,
          pieces: pieces > 0 ? pieces : undefined,
        }),
      });
    } catch {
      setError(
        "We could not reach the shop just now. Please try again, or call us."
      );
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        className="mx-auto max-w-lg rounded-xl border border-border bg-card"
        style={{ "--notch-bg": "var(--background)" } as React.CSSProperties}
      >
        <div className="px-7 pt-8 pb-6 text-center">
          <p className="font-display text-sm font-extrabold tracking-[0.16em] text-brand-ember uppercase">
            Request received
          </p>
          <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight">
            We have your details
          </h2>
          <p className="mt-3 text-muted-foreground">
            Someone from the shop will call you to confirm the time before we
            set out.
          </p>
        </div>

        <div className="ticket-tear" />

        <div className="px-7 pt-6 pb-8">
          {ownerWhatsApp ? (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Want it seen sooner? Send it to us on WhatsApp as well.
              </p>
              <a
                href={`https://wa.me/${ownerWhatsApp}?text=${encodeURIComponent(sent.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-lg bg-primary px-5 py-3 text-center font-medium text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                Send this on WhatsApp
              </a>
            </>
          ) : null}

          <Link
            href="/"
            className="mt-3 block rounded-lg border border-border px-5 py-3 text-center font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Back to the home page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start">
      <div className="grid gap-5">
        <Field label="Your name" name="customerName" required autoComplete="name" />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Phone number"
            name="phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0300 1234567"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            hint="Optional"
          />
        </div>

        <Field
          label="Pickup address"
          name="address"
          required
          multiline
          autoComplete="street-address"
          placeholder="House no, street, area"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Preferred date"
            name="preferredDate"
            required
            type="date"
            min={minDate}
            max={maxDate}
            defaultValue={minDate}
          />
          <Select label="Preferred time" name="timeSlot" options={slots} required />
        </div>

        <Select
          label="What do you need done?"
          name="serviceType"
          options={services}
          required
        />

        <Field
          label="Anything we should know?"
          name="note"
          multiline
          hint="Optional — stains, delicate pieces, gate code"
        />

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
          {sending ? "Sending…" : "Request a pickup"}
        </button>
      </div>

      {/* What they built in the calculator, carried over. */}
      <aside
        className="rounded-xl border border-border bg-card"
        style={{ "--notch-bg": "var(--background)" } as React.CSSProperties}
      >
        <div className="px-6 pt-6 pb-5">
          <p className="font-display text-sm font-extrabold tracking-[0.16em] uppercase">
            Your list
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {basket.length === 0
              ? "Nothing added"
              : `${pieces} ${pieces === 1 ? "piece" : "pieces"}`}
          </p>
        </div>

        <div className="ticket-tear" />

        {basket.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              You can send this without a list — we count everything at the
              shop anyway.
            </p>
            <Link
              href="/calculator"
              className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
            >
              Work out a bill first
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid gap-2.5 px-6 py-6 text-sm">
              {basket.map((line) => (
                <li key={line.name} className="flex items-baseline gap-2">
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {line.quantity}×
                  </span>
                  <span className="min-w-0">{line.name}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="font-mono tabular-nums">
                    {(line.unitPrice * line.quantity).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t border-border px-6 py-5">
              <span className="font-display text-sm font-extrabold tracking-[0.16em] uppercase">
                Estimate
              </span>
              <span className="font-mono text-xl tabular-nums">
                Rs {total.toLocaleString()}
              </span>
            </div>
          </>
        )}
      </aside>
    </form>
  );
}

function Field({
  label,
  name,
  hint,
  multiline,
  ...input
}: {
  label: string;
  name: string;
  hint?: string;
  multiline?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const className =
    "w-full rounded-lg border border-border bg-card px-4 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {hint && (
          <span className="ml-2 font-normal text-muted-foreground">{hint}</span>
        )}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          rows={3}
          required={input.required}
          placeholder={input.placeholder}
          autoComplete={input.autoComplete}
          className={className}
        />
      ) : (
        <input id={name} name={name} {...input} className={className} />
      )}
    </div>
  );
}

function Select({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="" disabled>
          Choose one
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
