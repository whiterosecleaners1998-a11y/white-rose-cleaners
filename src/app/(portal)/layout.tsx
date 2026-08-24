import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import LogoutButton from "./logout-button";
import MobileNav from "./mobile-nav";

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shopName = process.env.SHOP_NAME || "Dry Cleaner Portal";

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-card print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image
              src="/white-rose-logo.png"
              alt={shopName}
              width={377}
              height={362}
              className="h-11 w-auto shrink-0"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" render={<Link href="/" />}>
              New Booking
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/search" />}>
              Find by Phone
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/orders" />}>
              Orders
            </Button>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/settings/prices" />}
            >
              Price List
            </Button>
            <LogoutButton />
          </nav>
          <MobileNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t bg-card py-4 print:hidden">
        <p className="text-center text-xs text-muted-foreground">
          System by NexivoStudio.io
        </p>
      </footer>
    </div>
  );
}
