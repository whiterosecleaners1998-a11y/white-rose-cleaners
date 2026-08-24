"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Search, SquarePen, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Only "/" needs an exact match; the rest own their subpaths. */
  exact?: boolean;
};

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Bookings",
    items: [
      { href: "/", label: "New Booking", icon: SquarePen, exact: true },
      { href: "/orders", label: "Orders", icon: ClipboardList },
      { href: "/search", label: "Find by Phone", icon: Search },
    ],
  },
  {
    heading: "Settings",
    items: [{ href: "/settings/prices", label: "Price List", icon: Tags }],
  },
];

export default function SidebarNav({
  onNavigate,
}: {
  /** Lets the mobile sheet close itself when a link is tapped. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading} className="grid gap-1">
          <p className="px-3 pb-1 text-[0.68rem] font-medium tracking-wider text-muted-foreground uppercase">
            {group.heading}
          </p>
          {group.items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
