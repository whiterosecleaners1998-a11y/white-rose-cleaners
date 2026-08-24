"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusPills from "./status-pills";

export default function OrdersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = searchParams.get("status") ?? "ALL";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`/orders?${params.toString()}`);
  }

  function handleQueryChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams({ q: value }), 300);
  }

  const hasFilters = status !== "ALL" || from || to || q;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="orders-q"
          value={q}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search orders, customers..."
          aria-label="Search orders"
          className="pl-8"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label htmlFor="orders-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="orders-from"
            type="date"
            value={from}
            onChange={(e) => updateParams({ from: e.target.value })}
            className="w-full sm:w-36"
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="orders-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="orders-to"
            type="date"
            value={to}
            onChange={(e) => updateParams({ to: e.target.value })}
            className="w-full sm:w-36"
          />
        </div>

        <StatusPills />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              router.push("/orders");
            }}
          >
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
