"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Search as SearchIcon, X, Printer, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { pageWindow } from "@/lib/pagination";

type Booking = {
  id: string;
  bookingCode: string;
  customerName: string;
  phone: string;
  status: "RECEIVED" | "READY" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  createdAt: string | Date;
};

const PAGE_SIZE = 10;

export default function RecentBookings({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(trimmed: string) {
    setLoading(true);
    setPage(1);
    fetch(`/api/bookings?q=${encodeURIComponent(trimmed)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setResults(data);
      })
      .finally(() => setLoading(false));
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (!trimmed) return;

    debounceRef.current = setTimeout(() => runSearch(trimmed), 300);
  }

  function clearQuery() {
    setQuery("");
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  const bookings = useMemo(
    () => (query.trim() ? (results ?? initialBookings) : initialBookings),
    [query, results, initialBookings]
  );

  // Paged in the browser rather than through the URL: this card shares the
  // page with the booking form, and a navigation would remount it and throw
  // away a half-built cart.
  const pageCount = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const visible = bookings.slice(start, start + PAGE_SIZE);
  const firstRow = bookings.length === 0 ? 0 : start + 1;
  const lastRow = Math.min(start + PAGE_SIZE, bookings.length);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by name, phone, or booking #"
          className="pl-8 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Searching..."
            : query
              ? "No bookings match your search."
              : "No bookings yet."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="hidden sm:table-cell">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <Link
                    href={`/bookings/${b.id}`}
                    className="font-mono text-xs font-medium text-foreground hover:underline"
                  >
                    {b.bookingCode}
                  </Link>
                </TableCell>
                <TableCell>{b.customerName}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {b.phone}
                </TableCell>
                <TableCell>{b.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={statusBadgeClass[b.status]}>
                    {statusLabel[b.status]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden py-3 text-muted-foreground sm:table-cell">
                  {new Date(b.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="hidden py-3 sm:table-cell">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      render={<Link href={`/bookings/${b.id}`} />}
                    >
                      <Eye className="size-3.5" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 hover:bg-primary/90 hover:shadow-md"
                      render={
                        <a
                          href={`/api/bookings/${b.id}/pdf?inline=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <Printer className="size-3.5" />
                      Print
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {bookings.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Showing {firstRow.toLocaleString()}&ndash;{lastRow.toLocaleString()}{" "}
            of {bookings.length.toLocaleString()} booking
            {bookings.length === 1 ? "" : "s"}
            {!query && (
              <>
                {" "}
                &middot;{" "}
                <Link href="/orders" className="underline hover:text-foreground">
                  see every order
                </Link>
              </>
            )}
          </p>
          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
              >
                Previous
              </Button>
              {pageWindow(current, pageCount).map((entry, i) =>
                entry === "gap" ? (
                  <span
                    key={`gap-${i}`}
                    className="px-1 text-xs text-muted-foreground"
                  >
                    &hellip;
                  </span>
                ) : (
                  <Button
                    key={entry}
                    variant={entry === current ? "default" : "ghost"}
                    size="sm"
                    className="min-w-8 px-2 tabular-nums"
                    onClick={() => setPage(entry)}
                  >
                    {entry}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={current >= pageCount}
                onClick={() => setPage(current + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
