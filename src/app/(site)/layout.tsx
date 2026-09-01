import Link from "next/link";
import { SHOP_LOGO, SHOP_LOGO_DARK } from "@/lib/shop";
import { laundryPackages } from "@/lib/packages";

/**
 * The public shop website — everything a customer sees before they have handed
 * anything over. It shares the root layout's fonts and tokens with the portal
 * but none of its chrome: no sidebar, no session, no data of anyone's.
 *
 * The counter lives at /portal and is reached from the one link in the corner.
 */

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const shopName = process.env.SHOP_NAME || "Dry Cleaner";

  // Packages only appear once the shop has set its own tiers, so the link
  // cannot lead to a page that would have to invent them. See lib/packages.ts.
  const nav = [
    { href: "/prices", label: "Prices" },
    { href: "/calculator", label: "Bill calculator" },
    ...(laundryPackages().length > 0
      ? [{ href: "/packages", label: "Packages" }]
      : []),
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-6 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            {/* The wordmark is black type on transparent, so it only ever gets
                used on a pale surface. The dark bands spell the name out in
                Archivo instead — see the hero and the footer. */}
            {SHOP_LOGO ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={SHOP_LOGO} alt={shopName} className="h-14 w-auto" />
            ) : (
              <span className="font-display text-lg font-extrabold tracking-tight uppercase">
                {shopName}
              </span>
            )}
          </Link>

          <nav className="ml-auto hidden items-center gap-7 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[0.95rem] text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-6">
            <Link
              href="/book"
              className="rounded-lg bg-primary px-4 py-2 text-[0.9rem] font-medium text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Request a pickup
            </Link>
            <Link
              href="/login"
              className="hidden rounded-lg border border-border px-3.5 py-2 text-[0.9rem] font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:block"
            >
              Staff login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#0c0a09] text-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          {/* The reversed mark if the shop has one; otherwise its name in type,
              which is what a black-on-white logo would have come to here. */}
          {SHOP_LOGO_DARK ? (
            <Link href="/" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SHOP_LOGO_DARK}
                alt={shopName}
                className="h-16 w-auto"
              />
            </Link>
          ) : (
            <p className="font-display text-sm font-extrabold tracking-[0.14em] text-white uppercase">
              {shopName}
            </p>
          )}
          <p className="text-sm">
            &copy; {new Date().getFullYear()} {shopName}. Portal and site by{" "}
            <a
              href="https://nexivostudio.io"
              className="text-white/90 underline underline-offset-2 hover:text-white"
            >
              NexivoStudio.io
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
