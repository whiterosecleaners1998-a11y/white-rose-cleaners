import type { Metadata } from "next";
import { getBundles, getPriceList } from "@/lib/price-list";
import Calculator from "./calculator";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";
  return {
    title: `Work out your bill — ${shopName}`,
    description:
      "Add what you are sending and see what it comes to, using the shop's own price list. No sign-up, no commitment.",
  };
}

export default async function CalculatorPage() {
  const [items, bundles] = await Promise.all([getPriceList(), getBundles()]);

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
      <p className="font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase">
        Before you come in
      </p>
      <h1 className="font-display mt-3 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight font-extrabold tracking-[-0.02em] uppercase">
        Work out your bill
      </h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        Add what you are sending and the total builds as you go. These are the
        shop&apos;s real prices, not a guide.
      </p>

      <div className="mt-12">
        <Calculator items={items} bundles={bundles} />
      </div>
    </section>
  );
}
