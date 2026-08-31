"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import SidebarNav from "./sidebar-nav";

export default function MobileNav() {
  const router = useRouter();
  // Controlled so tapping a link can close the sheet — SidebarNav renders plain
  // links, and sharing it with the sidebar is what keeps the two navs in step.
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="lg:hidden" />}
      >
        <Menu />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="px-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
        <Separator />
        <div className="px-4 pb-4">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut />
            Log out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
