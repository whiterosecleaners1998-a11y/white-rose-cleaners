"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusLabel } from "@/lib/status";
import { printReceiptSheet, isPrintShortcut } from "@/lib/print-receipt";
import { buildWhatsAppLink } from "@/lib/whatsapp-link";
import {
  orderReceivedMessage,
  orderReadyMessage,
} from "@/lib/whatsapp-messages";

type Status = "RECEIVED" | "READY" | "DELIVERED";

const STATUSES: Status[] = ["RECEIVED", "READY", "DELIVERED"];

export default function BookingActions({
  id,
  status,
  customerName,
  phone,
  bookingCode,
  totalAmount,
  shopName,
}: {
  id: string;
  status: Status;
  customerName: string;
  phone: string;
  bookingCode: string;
  totalAmount: number;
  shopName: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<Status>(status);
  const [loading, setLoading] = useState(false);

  // P prints the 80mm receipt sheet rendered alongside this page.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isPrintShortcut(event)) return;
      event.preventDefault();
      printReceiptSheet();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Which message fits depends on where the order is. Delivered orders get
  // none — there is nothing left to tell the customer.
  const customerMessage =
    current === "RECEIVED"
      ? orderReceivedMessage({
          customerName,
          bookingCode,
          totalAmount,
          shopName,
        })
      : current === "READY"
        ? orderReadyMessage({ customerName, bookingCode, shopName })
        : null;

  async function changeStatus(next: Status) {
    if (next === current) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update status");
        return;
      }
      setCurrent(next);
      toast.success(
        next === "READY"
          ? "Marked ready — tap below to message the customer."
          : `Status set to ${statusLabel[next]}.`
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 print:hidden">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">Status</Label>
        <Select
          value={current}
          onValueChange={(value) => changeStatus(value as Status)}
          disabled={loading}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {customerMessage && (
          <Button
            render={
              <a
                href={buildWhatsAppLink(phone, customerMessage)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageCircle />
            {current === "READY" ? "Send Ready Message" : "Send Received Message"}
          </Button>
        )}
        <Button variant="outline" onClick={printReceiptSheet}>
          <Printer />
          Print Receipt{" "}
          <kbd className="ml-0.5 rounded border px-1 font-mono text-[0.7em]">
            P
          </kbd>
        </Button>
        <Button variant="outline" render={<a href={`/api/bookings/${id}/pdf`} />}>
          <Download />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
