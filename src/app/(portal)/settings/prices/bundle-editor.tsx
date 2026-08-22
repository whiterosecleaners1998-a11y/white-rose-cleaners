"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Bundle = {
  id: string;
  name: string;
  items: { itemId: string; name: string; price: number; quantity: number }[];
};

export default function BundleEditor({
  items,
  initialBundles,
}: {
  items: PriceItem[];
  initialBundles: Bundle[];
}) {
  const router = useRouter();
  const [bundles, setBundles] = useState(initialBundles);
  const [name, setName] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const chosen = useMemo(
    () =>
      items
        .map((item) => ({ item, quantity: quantities[item.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [items, quantities]
  );

  const draftTotal = useMemo(
    () =>
      chosen.reduce((sum, line) => sum + line.item.price * line.quantity, 0),
    [chosen]
  );

  function setQuantity(id: string, quantity: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, quantity) }));
  }

  async function createBundle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give the bundle a name.");
      return;
    }
    if (chosen.length === 0) {
      setError("Set a quantity on at least one item.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          items: chosen.map((line) => ({
            itemId: line.item.id,
            quantity: line.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create bundle");
        return;
      }
      setBundles((prev) => [...prev, data]);
      setName("");
      setQuantities({});
      toast.success(`Bundle "${data.name}" created.`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeBundle(id: string) {
    const res = await fetch(`/api/bundles/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not remove that bundle.");
      return;
    }
    setBundles((prev) => prev.filter((bundle) => bundle.id !== id));
    toast.success("Bundle removed.");
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add some price list items first — a bundle is built from them.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {bundles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No bundles yet. Build one below and it appears as a one-press button on
          the booking form.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {bundles.map((bundle) => (
            <li
              key={bundle.id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{bundle.name}</p>
                <p className="text-xs text-muted-foreground">
                  {bundle.items
                    .map((line) => `${line.quantity} × ${line.name}`)
                    .join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm tabular-nums">
                  {bundle.items
                    .reduce((sum, line) => sum + line.price * line.quantity, 0)
                    .toFixed(2)}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="ghost" size="icon-sm" />}
                  >
                    <Trash2 className="text-destructive" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {bundle.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The bundle button disappears from the booking form. The
                        items themselves stay on the price list.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeBundle(bundle.id)}
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={createBundle}
        className="space-y-4 rounded-lg border bg-muted/30 p-4"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="bundleName">Bundle name</Label>
          <Input
            id="bundleName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Suit"
            className="w-full sm:w-56"
          />
        </div>

        <div className="grid gap-1.5">
          <Label>How many of each item?</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {item.price.toFixed(2)}
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  aria-label={`Quantity of ${item.name} in the bundle`}
                  value={quantities[item.id] ?? 0}
                  onChange={(e) =>
                    setQuantity(item.id, Number(e.target.value) || 0)
                  }
                  className="w-16 shrink-0 text-center"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {chosen.length === 0
              ? "Nothing selected yet."
              : `${chosen.length} item${chosen.length === 1 ? "" : "s"} · ${draftTotal.toFixed(2)}`}
          </p>
          <Button type="submit" disabled={busy}>
            <Plus />
            {busy ? "Creating..." : "Create bundle"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </div>
  );
}
