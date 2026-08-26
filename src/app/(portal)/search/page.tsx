"use client";

import Link from "next/link";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/phone-input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  status: "RECEIVED" | "READY" | "DELIVERED";
  totalAmount: number;
  createdAt: string;
};

export default function SearchPage() {
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/bookings?phone=${encodeURIComponent(phone)}`
      );
      if (!res.ok) {
        setError("Search failed");
        return;
      }
      setResults(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find by Phone Number</CardTitle>
        <CardDescription>
          Look up a customer&apos;s bookings using their phone number.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSearch} className="flex max-w-sm gap-2">
          <PhoneInput
            value={phone}
            onValueChange={setPhone}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            <SearchIcon />
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {results && (
          <div>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No bookings found for that number.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((b) => (
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
                      <TableCell>{b.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass[b.status]}>
                          {statusLabel[b.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
