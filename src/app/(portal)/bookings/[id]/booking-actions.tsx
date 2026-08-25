"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Download, MessageCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusLabel } from "@/lib/status";
import { balanceOf } from "@/lib/money";
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
  paidAmount,
  shopName,
  receiptUrl,
}: {
  id: string;
  status: Status;
  customerName: string;
  phone: string;
  bookingCode: string;
  totalAmount: number;
  paidAmount: number;
  shopName: string;
  receiptUrl: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<Status>(status);
  const [loading, setLoading] = useState(false);
  // Payment lives here rather than in its own component so the WhatsApp message
  // reflects a payment the moment it is recorded, without waiting on a refresh.
  const [paid, setPaid] = useState(paidAmount);
  const [paidInput, setPaidInput] = useState(paidAmount.toFixed(2));
  const [savingPayment, setSavingPayment] = useState(false);

  const remaining = balanceOf(totalAmount, paid);
  const typedPaid = Number(paidInput);
  const paidInputValid = paidInput.trim() !== "" && Number.isFinite(typedPaid);
  const paidChanged = paidInputValid && typedPaid !== paid;

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
          receiptUrl,
          paidAmount: paid,
          remainingAmount: remaining,
        })
      : current === "READY"
        ? orderReadyMessage({
            customerName,
            bookingCode,
            shopName,
            receiptUrl,
            remainingAmount: remaining,
          })
        : null;

  async function patchBooking(body: Record<string, unknown>) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Update failed");
    return data;
  }

  async function changeStatus(next: Status) {
    if (next === current) return;
    setLoading(true);
    try {
      await patchBooking({ status: next });
      setCurrent(next);
      toast.success(
        next === "READY"
          ? "Marked ready — tap below to message the customer."
          : `Status set to ${statusLabel[next]}.`
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setLoading(false);
    }
  }

  async function savePayment(next: number) {
    setSavingPayment(true);
    try {
      // The server caps the figure at the order total, so take its answer
      // rather than assuming what we sent was kept.
      const data = await patchBooking({ paidAmount: next });
      setPaid(data.paidAmount);
      setPaidInput(Number(data.paidAmount).toFixed(2));
      toast.success(
        data.remainingAmount > 0
          ? `Payment recorded. Balance ${Number(data.remainingAmount).toFixed(2)}.`
          : "Payment recorded. Paid in full."
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record payment"
      );
    } finally {
      setSavingPayment(false);
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
          <SelectTrigger>
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
        <Label className="text-sm text-muted-foreground" htmlFor="paid-amount">
          Paid
        </Label>
        {/* The base Input is h-10 with a larger type scale, built for form
            fields rather than a toolbar; bring it down to the button height so
            it lines up with the select and the buttons beside it. */}
        <Input
          id="paid-amount"
          type="number"
          min={0}
          max={totalAmount}
          step="0.01"
          inputMode="decimal"
          value={paidInput}
          onChange={(event) => setPaidInput(event.target.value)}
          disabled={savingPayment}
          className="h-8 w-24 px-2.5 text-sm tabular-nums"
        />
        <span className="text-sm tabular-nums text-muted-foreground">
          of {totalAmount.toFixed(2)}
        </span>
        {paidChanged && (
          <Button
            variant="outline"
            onClick={() => savePayment(typedPaid)}
            disabled={savingPayment}
          >
            Save
          </Button>
        )}
        {remaining > 0 ? (
          <>
            <PaymentPill tone="due">Balance {remaining.toFixed(2)}</PaymentPill>
            {/* Hidden while an edit is pending so the two buttons cannot
                disagree about what is about to be saved. */}
            {!paidChanged && (
              <Button
                variant="outline"
                onClick={() => savePayment(totalAmount)}
                disabled={savingPayment}
              >
                <Wallet />
                Mark paid
              </Button>
            )}
          </>
        ) : (
          <PaymentPill tone="settled">Paid in full</PaymentPill>
        )}
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

/** Amber while money is owed, green once it is not — the status pill palette. */
function PaymentPill({
  tone,
  children,
}: {
  tone: "due" | "settled";
  children: React.ReactNode;
}) {
  const tint =
    tone === "due"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400"
      : "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400";
  return (
    <span
      className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium tabular-nums ${tint}`}
    >
      {children}
    </span>
  );
}
