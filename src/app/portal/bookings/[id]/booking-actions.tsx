"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  Download,
  MessageCircle,
  Wallet,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Status = "RECEIVED" | "READY" | "DELIVERED" | "CANCELLED";

const STATUSES: Status[] = ["RECEIVED", "READY", "DELIVERED", "CANCELLED"];

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
    current === "CANCELLED"
      ? null
      : current === "RECEIVED"
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
          : next === "CANCELLED"
            ? "Booking cancelled. It keeps its number and stays searchable."
            : current === "CANCELLED"
              ? `Booking restored — back to ${statusLabel[next]}.`
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

  async function deleteBooking() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toast.success(`Booking ${bookingCode} deleted.`);
      // Nothing left to show on this page.
      router.push("/portal/orders");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete booking"
      );
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
    <div className="rounded-xl border bg-card shadow-xs print:hidden">
      {/* Two zones rather than one long row: what is true about the order,
          then what can be done with it. Each control gets a label above it so
          nothing has to compete for width with its own caption. */}
      <div className="flex flex-wrap items-start gap-x-10 gap-y-5 p-4 sm:p-5">
        <div className="grid gap-1.5">
          <FieldLabel>Status</FieldLabel>
          <Select
            value={current}
            onValueChange={(value) => changeStatus(value as Status)}
            disabled={loading}
          >
            <SelectTrigger className="w-40">
              {/* Base UI renders the raw value unless told otherwise, which
                  puts a shouty RECEIVED next to the Received badge below. */}
              <SelectValue>
                {(value) => statusLabel[value as string] ?? String(value)}
              </SelectValue>
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

        <div className="grid gap-1.5">
          <FieldLabel htmlFor="paid-amount">Payment</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            {/* The base Input is h-10 with a larger type scale, built for form
                fields rather than a toolbar; bring it down to the select's
                height so the row sits on one line. */}
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
              className="h-9 w-24 px-2.5 text-sm tabular-nums"
            />
            <span className="text-sm tabular-nums text-muted-foreground">
              of {totalAmount.toFixed(2)}
            </span>
            {paidChanged ? (
              // Hidden while an edit is pending so the two buttons cannot
              // disagree about what is about to be saved.
              <Button
                size="sm"
                onClick={() => savePayment(typedPaid)}
                disabled={savingPayment}
              >
                Save
              </Button>
            ) : remaining > 0 ? (
              <>
                <PaymentPill tone="due">
                  Balance {remaining.toFixed(2)}
                </PaymentPill>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => savePayment(totalAmount)}
                  disabled={savingPayment}
                >
                  <Wallet />
                  Mark paid
                </Button>
              </>
            ) : (
              <PaymentPill tone="settled">Paid in full</PaymentPill>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-2 p-4 sm:px-5 sm:py-4">
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
            {current === "READY"
              ? "Send Ready Message"
              : "Send Received Message"}
          </Button>
        )}
        <Button variant="outline" onClick={printReceiptSheet}>
          <Printer />
          Print Receipt{" "}
          <kbd className="ml-0.5 rounded border px-1 font-mono text-[0.7em]">
            P
          </kbd>
        </Button>
        <Button
          variant="outline"
          render={<a href={`/api/bookings/${id}/pdf`} />}
        >
          <Download />
          Download PDF
        </Button>

        {/* Erasing is for bookings that should never have existed. Cancelling
            covers a real order that fell through, so this sits away from the
            everyday buttons, stays quiet until hovered, and asks first. */}
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                disabled={loading}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:ml-auto"
              />
            }
          >
            <Trash2 />
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete booking {bookingCode}?</AlertDialogTitle>
              <AlertDialogDescription>
                This erases {customerName}&apos;s order and its items for good,
                and the number is never reissued. There is no undo.
                {current !== "CANCELLED" &&
                  " To void a real order but keep the record, set its status to Cancelled instead."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={deleteBooking}>
                Delete for good
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/** Small caps caption above a control, so labels stop eating row width. */
function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
    >
      {children}
    </Label>
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
