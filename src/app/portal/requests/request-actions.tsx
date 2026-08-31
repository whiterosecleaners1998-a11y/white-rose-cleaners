"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Status = "NEW" | "CONTACTED" | "CLOSED";

/**
 * Moving a request along from the counter's screen.
 *
 * There is no "turn this into a booking" button on purpose: a booking is
 * raised when the clothes are physically on the counter and can be counted,
 * which is the booking form's job. This screen only tracks whether anyone has
 * rung the customer back.
 */
export default function RequestActions({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: Status) {
    setBusy(true);
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);

    if (!res.ok) {
      toast.error("Could not update that request.");
      return;
    }

    toast.success(
      next === "CONTACTED"
        ? "Marked as called back."
        : next === "CLOSED"
          ? "Request closed."
          : "Request reopened."
    );
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "NEW" && (
        <Button size="sm" disabled={busy} onClick={() => setStatus("CONTACTED")}>
          Mark as called
        </Button>
      )}
      {status !== "CLOSED" && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setStatus("CLOSED")}
        >
          Close
        </Button>
      )}
      {status !== "NEW" && (
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => setStatus("NEW")}
        >
          Reopen
        </Button>
      )}
    </div>
  );
}
