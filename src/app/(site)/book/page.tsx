import type { Metadata } from "next";
import { isoDay, PICKUP_DAYS_AHEAD, pickupServices, pickupSlots } from "@/lib/pickup";
import BookForm from "./book-form";

export async function generateMetadata(): Promise<Metadata> {
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";
  return {
    title: `Request a pickup — ${shopName}`,
    description:
      "Tell us where and when, and we will collect your clothes. Someone from the shop calls to confirm before we set out.",
  };
}

export default function BookPage() {
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";
  const today = new Date();
  const latest = new Date(today);
  latest.setDate(latest.getDate() + PICKUP_DAYS_AHEAD);

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
      <p className="font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase">
        We come to you
      </p>
      <h1 className="font-display mt-3 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight font-extrabold tracking-[-0.02em] uppercase">
        Request a pickup
      </h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        Tell us where and when. Someone from {shopName} will call to confirm
        before we set out — nothing is charged until we have counted your things
        at the shop.
      </p>

      <div className="mt-12">
        <BookForm
          services={pickupServices()}
          slots={pickupSlots()}
          minDate={isoDay(today)}
          maxDate={isoDay(latest)}
          ownerWhatsApp={
            process.env.NEXT_PUBLIC_OWNER_WHATSAPP_NUMBER?.trim() ?? ""
          }
        />
      </div>
    </section>
  );
}
