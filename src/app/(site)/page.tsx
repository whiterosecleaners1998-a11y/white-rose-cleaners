import type { Metadata } from "next";
import Link from "next/link";
import { shopContacts } from "@/lib/receipt-data";
import { laundryPackages } from "@/lib/packages";
import { pickupServices, SERVICE_NOTES } from "@/lib/pickup";

/**
 * The shop's front page.
 *
 * It carries no prices of its own — the full list lives on /prices and the
 * calculator on /calculator, both reading the table the counter bills from.
 * This page's job is to say what the shop does and give three ways in: send for
 * a pickup, work out a bill, or just come to the counter.
 */

/** The turnaround the receipt promises. Kept in step with getExpectedDelivery. */
const TURNAROUND_DAYS = 5;

export async function generateMetadata(): Promise<Metadata> {
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";
  return {
    title: `${shopName} — dry cleaning, laundry and pressing`,
    description: `Drop your clothes at ${shopName} or ask us to collect. Every order gets a numbered ticket. Ready in ${TURNAROUND_DAYS} days.`,
  };
}

/**
 * The logo's swoosh, redrawn as a rule. The one piece of brand decoration.
 *
 * The id has to be given rather than fixed, because a gradient is referenced by
 * id and the page draws more than one of these — two elements answering to the
 * same id means the second one points at the first one's gradient.
 */
function Arc({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 240 14"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* userSpaceOnUse: the stops below are placed in viewBox coordinates,
            and the default (objectBoundingBox) would read x2="240" as 24000%,
            putting every stop past the end and leaving a flat ember line. */}
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="240"
          y2="0"
        >
          <stop stopColor="var(--brand-ember)" />
          <stop offset="0.55" stopColor="var(--brand-orange)" />
          <stop offset="1" stopColor="var(--brand-amber)" />
        </linearGradient>
      </defs>
      <path
        d="M2 11C58 3 182 3 238 9"
        stroke={`url(#${id})`}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HomePage() {
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";
  const tagline = process.env.NEXT_PUBLIC_SHOP_TAGLINE?.trim() ?? "";
  const prefix = process.env.BOOKING_PREFIX || "WRD";
  const address = process.env.SHOP_ADDRESS?.trim() ?? "";
  const hours = process.env.SHOP_HOURS?.trim() ?? "";
  const whatsapp = process.env.NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER?.trim() ?? "";
  const contacts = shopContacts();
  const services = pickupServices();
  const hasPackages = laundryPackages().length > 0;

  return (
    <>
      {/* ---- Hero ------------------------------------------------------- */}
      <section className="bg-[#0c0a09] text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
          <div>
            <p className="font-mono text-xs tracking-[0.22em] text-brand-amber uppercase">
              {[shopName, tagline].filter(Boolean).join(" — ")}
            </p>

            <h1 className="font-display mt-6 text-[clamp(1.9rem,4.6vw,3.25rem)] leading-[0.95] font-extrabold tracking-[-0.02em] uppercase">
              Hand it over.
              <br />
              Take the ticket.
              <br />
              Collect it clean.
            </h1>

            <Arc id="arc-hero" className="mt-5 h-3.5 w-56" />

            <p className="mt-7 max-w-md text-lg text-white/70">
              Dry cleaning, laundry and pressing. Bring it to the counter or ask
              us to collect — either way it is written up against a numbered
              ticket, so you know what you left and when it is due back.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/book"
                className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                Request a pickup
              </Link>
              <Link
                href="/calculator"
                className="rounded-lg border border-white/25 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/40 focus-visible:outline-none"
              >
                Work out your bill
              </Link>
            </div>
          </div>

          {/* The ticket. The number is a specimen; the turnaround on it is the
              one the receipt actually prints. */}
          <div
            className="mx-auto w-full max-w-sm rounded-xl bg-white text-[#0c0a09] shadow-2xl lg:rotate-[-1.5deg]"
            style={{ "--notch-bg": "#0c0a09" } as React.CSSProperties}
          >
            <div className="px-7 pt-7 pb-6">
              <p className="font-display text-[0.72rem] font-extrabold tracking-[0.18em] text-black/45 uppercase">
                {shopName}
              </p>
              <p className="mt-5 font-mono text-4xl font-medium tracking-tight">
                {prefix}-00412
              </p>
              <p className="mt-1.5 text-sm text-black/50">Your ticket number</p>
            </div>

            {/* Full-bleed, so the bites land on the ticket's own edges. */}
            <div className="ticket-tear" />

            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 px-7 pt-6 pb-8 text-sm">
              <dt className="text-black/50">Items</dt>
              <dd className="text-right font-mono">3</dd>
              <dt className="text-black/50">Received</dt>
              <dd className="text-right font-mono">Today</dd>
              <dt className="text-black/50">Ready by</dt>
              <dd className="text-right font-mono font-medium">
                In {TURNAROUND_DAYS} days
              </dd>
            </dl>
          </div>
        </div>
      </section>

      {/* ---- What we do -------------------------------------------------- */}
      <section id="services" className="scroll-mt-20 bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <p className="font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase">
            What we do
          </p>
          <h2 className="font-display mt-3 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight font-extrabold tracking-[-0.02em] uppercase">
            Four ways we can help
          </h2>

          <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <li key={service}>
                <h3 className="font-display text-lg font-extrabold tracking-tight">
                  {service}
                </h3>
                {SERVICE_NOTES[service] && (
                  <p className="mt-2 text-muted-foreground">
                    {SERVICE_NOTES[service]}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-muted-foreground">
            Bedding, curtains, towels and sofa covers go through too —{" "}
            <Link href="/prices" className="underline underline-offset-4">
              they are all on the price list
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ---- How it works ------------------------------------------------ */}
      <section
        id="how"
        className="scroll-mt-20 border-y border-border bg-muted/40"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <p className="font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase">
            Start to finish
          </p>
          <h2 className="font-display mt-3 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight font-extrabold tracking-[-0.02em] uppercase">
            How it works
          </h2>

          {/* Numbered because this genuinely is an order of events: nothing
              here can happen before the step above it. */}
          <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {[
              {
                title: "Send for us, or come in",
                body: "Ask for a pickup and we collect from your door, or bring your things to the counter — whichever suits.",
              },
              {
                title: "We count and ticket it",
                body: `Every piece is written up and you get a numbered slip — ${prefix}-00412 and the like — listing what came in and what it comes to.`,
              },
              {
                title: "Collect them pressed",
                body: `Ready in ${TURNAROUND_DAYS} days. Bring the ticket number, settle the balance, and take them home.`,
              },
            ].map((step, index) => (
              <li key={step.title}>
                <p className="font-mono text-sm text-brand-ember">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="font-display mt-3 text-xl font-extrabold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Three doors -------------------------------------------------- */}
      <section className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <ul
            className={`grid gap-5 ${hasPackages ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
          >
            <li>
              <Link
                href="/prices"
                className="flex h-full flex-col rounded-xl border border-border bg-card p-7 transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <h3 className="font-display text-lg font-extrabold tracking-tight uppercase">
                  Price list
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Every garment and set we take, with what each one costs.
                </p>
              </Link>
            </li>
            <li>
              <Link
                href="/calculator"
                className="flex h-full flex-col rounded-xl border border-border bg-card p-7 transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <h3 className="font-display text-lg font-extrabold tracking-tight uppercase">
                  Work out your bill
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Add up what you are sending before you send it. Real prices,
                  no sign-up.
                </p>
              </Link>
            </li>
            {hasPackages && (
              <li>
                <Link
                  href="/packages"
                  className="flex h-full flex-col rounded-xl border border-border bg-card p-7 transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <h3 className="font-display text-lg font-extrabold tracking-tight uppercase">
                    Monthly packages
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Buy pieces in a block and pay less for each one.
                  </p>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* ---- Visit ------------------------------------------------------- */}
      <section id="visit" className="scroll-mt-20 bg-[#0c0a09] text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="font-mono text-xs tracking-[0.22em] text-brand-amber uppercase">
              Come and see us
            </p>
            <h2 className="font-display mt-3 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight font-extrabold tracking-[-0.02em] uppercase">
              Visit the shop
            </h2>
            <Arc id="arc-visit" className="mt-5 h-3.5 w-44" />

            {address && (
              <p className="mt-7 max-w-sm text-lg whitespace-pre-line text-white/70">
                {address}
              </p>
            )}
            {hours && (
              <p className="mt-4 text-white/70">
                <span className="text-white/50">Open</span> {hours}
              </p>
            )}

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                className="mt-9 inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                Message us on WhatsApp
              </a>
            )}
          </div>

          {contacts.length > 0 && (
            <div className="lg:justify-self-end">
              <p className="font-display text-sm font-extrabold tracking-[0.16em] text-white/50 uppercase">
                Call us
              </p>
              <ul className="mt-6 grid gap-5">
                {contacts.map((contact) => {
                  const [name, number] = contact.split(/:\s*/);
                  return (
                    <li key={contact}>
                      <p className="text-sm text-white/50">{name}</p>
                      <a
                        href={`tel:${number?.replace(/[^\d+]/g, "")}`}
                        className="font-mono text-2xl tracking-tight text-white underline-offset-4 hover:underline"
                      >
                        {number}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
