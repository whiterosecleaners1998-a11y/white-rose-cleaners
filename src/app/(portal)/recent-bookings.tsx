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

type Booking = {
  id: string;
  bookingCode: string;
  customerName: string;
  phone: string;
  status: "RECEIVED" | "READY" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  createdAt: string | Date;
};

export default function RecentBookings({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(trimmed: string) {
    setLoading(true);
    fetch(`/api/bookings?q=${encodeURIComponent(trimmed)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setResults(data);
      })
      .finally(() => setLoading(false));
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (!trimmed) return;

    debounceRef.current = setTimeout(() => runSearch(trimmed), 300);
  }

  function clearQuery() {
    setQuery("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  const bookings = useMemo(
    () => (query.trim() ? (results ?? initialBookings) : initialBookings),
    [query, results, initialBookings]
  );

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
            {bookings.map((b) => (
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
    </div>
  );
}
