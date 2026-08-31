"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type PriceItem = {
  id: string;
  name: string;
  price: number;
};

export default function PriceListEditor({
  initialItems,
}: {
  initialItems: PriceItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceNumber = Number(price);
    if (!name.trim() || Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("Enter a name and a valid price.");
      return;
    }
    const res = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), price: priceNumber }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to add item");
      return;
    }
    setItems((prev) => [...prev, data]);
    setName("");
    setPrice("");
    toast.success(`Added "${data.name}" to the price list.`);
    router.refresh();
  }

  async function updatePrice(id: string, newPrice: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/prices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: newPrice }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, price: newPrice } : item))
        );
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/prices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success("Item removed.");
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function removeAll() {
    setBusyId("__all__");
    try {
      const res = await fetch("/api/prices", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to clear the price list");
        return;
      }
      setItems([]);
      toast.success(
        data.removed === 1 ? "1 item removed." : `${data.removed} items removed.`
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      {items.length > 0 && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === "__all__"}
                />
              }
            >
              <Trash2 className="text-destructive" />
              Remove all
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Remove all {items.length} items?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  The price list is emptied so you can enter your own. Any
                  bundles built from these items are emptied too. Past bookings
                  keep their own copy of every line and are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={removeAll}>
                  Remove all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={item.price}
                    disabled={busyId === item.id}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isNaN(val) && val !== item.price) {
                        updatePrice(item.id, val);
                      }
                    }}
                    className="w-24"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={busyId === item.id}
                        />
                      }
                    >
                      <Trash2 className="text-destructive" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {item.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          It will no longer appear on the booking form. Past
                          bookings are not affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <form
        onSubmit={addItem}
        className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="itemName">Item name</Label>
          <Input
            id="itemName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Shirt"
            className="w-40"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="itemPrice">Price</Label>
          <Input
            id="itemPrice"
            type="number"
            step="0.01"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-28"
          />
        </div>
        <Button type="submit" className="w-full sm:w-auto">
          <Plus />
          Add item
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
