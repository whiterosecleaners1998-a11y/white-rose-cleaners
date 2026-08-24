"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { statusLabel } from "@/lib/status";
import { cn } from "@/lib/utils";

const PILLS = ["ALL", "RECEIVED", "READY", "DELIVERED"] as const;

/**
 * The status filter as a pill row. It writes the same `status` search param the
 * dropdown used, so it and the rest of the filters stay in sync — this replaces
 * the Status select rather than sitting alongside it.
 */
export default function StatusPills() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "ALL";

  function select(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") params.delete("status");
    else params.set("status", status);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `/orders?${query}` : "/orders");
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {PILLS.map((pill) => {
        const active = current === pill;
        return (
          <button
            key={pill}
            type="button"
            onClick={() => select(pill)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
            )}
          >
            {pill === "ALL" ? "All" : statusLabel[pill]}
          </button>
        );
      })}
    </div>
  );
}
