"use client";

import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SIDEBAR_STORAGE_KEY } from "@/lib/sidebar";

/**
 * Collapses the sidebar to an icon rail.
 *
 * The state is a single `data-sidebar` attribute on <html>, with the widths
 * handled in CSS — that keeps the shell a server component and means the
 * pre-paint script in the root layout can restore the choice before first
 * paint, instead of the sidebar visibly snapping shut after hydration.
 */
export default function SidebarToggle() {
  const [collapsed, setCollapsed] = useState(false);

  // The attribute is already set by the pre-paint script; read it back so the
  // button starts with the right icon rather than assuming expanded.
  useEffect(() => {
    setCollapsed(
      document.documentElement.dataset.sidebar === "collapsed"
    );
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.documentElement.dataset.sidebar = next ? "collapsed" : "expanded";
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Private mode or blocked storage: the toggle still works this session.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="size-8 shrink-0"
      aria-expanded={!collapsed}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <PanelLeftOpen className="size-4" />
      ) : (
        <PanelLeftClose className="size-4" />
      )}
      <span className="sr-only">
        {collapsed ? "Expand sidebar" : "Collapse sidebar"}
      </span>
    </Button>
  );
}
