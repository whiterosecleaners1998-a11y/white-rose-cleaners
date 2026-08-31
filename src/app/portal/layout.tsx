import Link from "next/link";
import { SHOP_LOGO, SHOP_TAGLINE } from "@/lib/shop";
import LogoutButton from "./logout-button";
import MobileNav from "./mobile-nav";
import SidebarNav from "./sidebar-nav";
import SidebarToggle from "./sidebar-toggle";

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shopName = process.env.SHOP_NAME || "Dry Cleaner Portal";

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Fixed so the order table scrolls under it rather than pushing it away.
          Below lg it gives way to the sheet in MobileNav. */}
      <aside className="app-sidebar fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card lg:flex print:hidden">
        {/* Collapsed, the rail is too narrow for both logo and toggle, so the
            brand folds away and the toggle centres in its place. */}
        <div className="sidebar-brand flex items-center gap-2.5 border-b px-3 py-4">
          <Link
            href="/portal"
            className="sidebar-label flex min-w-0 items-center gap-2.5"
          >
            {/* Every shop brings its own logo of its own shape, so this is a
                plain img sized by CSS rather than next/image, which wants the
                asset's pixel dimensions up front and would squash anything
                that is not 377x362. */}
            {SHOP_LOGO && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={SHOP_LOGO}
                alt=""
                className="size-9 shrink-0 object-contain"
              />
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm leading-tight font-semibold">
                {shopName}
              </span>
              {SHOP_TAGLINE && (
                <span className="block truncate text-xs text-muted-foreground">
                  {SHOP_TAGLINE}
                </span>
              )}
            </span>
          </Link>
          <div className="ml-auto">
            <SidebarToggle />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav />
        </div>

        <div className="sidebar-foot flex items-center border-t p-3">
          <LogoutButton />
        </div>
      </aside>

      <div className="app-content flex min-h-screen flex-col lg:pl-60">
        {/* Only small screens need a top bar; on lg the sidebar is the nav. */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-2.5 lg:hidden print:hidden">
          <Link href="/portal" className="flex min-w-0 items-center gap-2">
            {SHOP_LOGO ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={SHOP_LOGO} alt={shopName} className="h-9 w-auto shrink-0" />
            ) : (
              <span className="truncate text-sm font-semibold">{shopName}</span>
            )}
          </Link>
          <MobileNav />
        </header>

        <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <footer className="px-4 py-5 print:hidden">
          <p className="text-center text-xs text-muted-foreground">
            System by NexivoStudio.io
          </p>
        </footer>
      </div>
    </div>
  );
}
