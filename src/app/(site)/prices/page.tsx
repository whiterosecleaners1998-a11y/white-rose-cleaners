import type { Metadata } from "next";
import Link from "next/link";
import { getBundles, getPriceList } from "@/lib/price-list";

/**
 * The whole price list, as the shop keeps it. Read from the table the counter
 * bills from — putting a new price up in the portal puts it up here too, with
 * five minutes of cache between the two.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";
  return {
    title: `Price list — ${shopName}`,
    description:
      "What we charge, per garment and per set. The same list the counter bills from.",
  };
}

export default async function PricesPage() {
  const [items, bundles] = await Promise.all([getPriceList(), getBundles()]);

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
      <p className="font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase">
        What it costs
      </p>
      <h1 className="font-display mt-3 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight font-extrabold tracking-[-0.02em] uppercase">
        The price list
      </h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        The same list the counter works from. Prices are per garment, in rupees.{" "}
        <Link href="/calculator" className="underline underline-offset-4">
          Add yours up
        </Link>{" "}
        if you want a total before you come in.
      </p>

      {items.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
          The price list is being updated. Call the shop for a quote.
        </p>
      ) : (
        <div
          className="mt-12 rounded-xl border border-border bg-card px-6 py-8 sm:px-10 sm:py-10"
          style={{ "--notch-bg": "var(--background)" } as React.CSSProperties}
        >
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-display text-sm font-extrabold tracking-[0.16em] uppercase">
              Per garment
            </p>
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Rs
            </p>
          </div>

          <ul className="mt-7 grid gap-x-10 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-baseline gap-2">
                <span>{item.name}</span>
                <span className="leader" aria-hidden="true" />
                <span className="font-mono tabular-nums">
                  {item.price.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>

          {bundles.length > 0 && (
            <>
              <div className="ticket-tear mt-10 -mx-6 sm:-mx-10" />

              <p className="font-display mt-8 text-sm font-extrabold tracking-[0.16em] uppercase">
                Sets
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Booked in one go at the counter, priced as the sum of their
                parts.
              </p>

              <ul className="mt-6 grid gap-x-14 gap-y-4 sm:grid-cols-2">
                {bundles.map((bundle) => (
                  <li key={bundle.id}>
                    <div className="flex items-baseline gap-2">
                      <span>{bundle.name}</span>
                      <span className="leader" aria-hidden="true" />
                      <span className="font-mono tabular-nums">
                        {bundle.total.toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {bundle.parts
                        .map((part) =>
                          part.quantity > 1
                            ? `${part.quantity} × ${part.name}`
                            : part.name
                        )
                        .join(" + ")}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
