import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { laundryPackages } from "@/lib/packages";
import PackagesClient from "./packages-client";

export async function generateMetadata(): Promise<Metadata> {
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";
  return {
    title: `Monthly packages — ${shopName}`,
    description:
      "Buy a block of pieces up front at a better rate per piece than the counter.",
  };
}

export default function PackagesPage() {
  const packages = laundryPackages();

  // No tiers configured means the shop has not decided on this offer, and a
  // page inventing one on its behalf would be worse than no page. The nav link
  // is hidden on the same condition, so this is only reachable by typing it.
  if (packages.length === 0) notFound();

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
      <p className="font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase">
        For regulars
      </p>
      <h1 className="font-display mt-3 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight font-extrabold tracking-[-0.02em] uppercase">
        Monthly packages
      </h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        Buy a block of pieces up front and each one costs less than it does at
        the counter. Useful if the same load comes in every week.
      </p>

      <PackagesClient packages={packages} />
    </section>
  );
}
