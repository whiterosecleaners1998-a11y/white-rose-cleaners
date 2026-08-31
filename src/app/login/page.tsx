"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SHOP_LOGO } from "@/lib/shop";

/** Where a login lands when it was not sent here from somewhere in particular. */
const PORTAL_HOME = "/portal";

// Where a signed-in user may be sent back to. This used to be a list of the
// portal's pages, kept in step by hand; now that the portal is one subtree, the
// subtree is the rule. Anything else — an off-site URL, a protocol-relative
// "//evil.com", a decoy like "/portal-login" — falls back to the portal home, so
// a successful login never lands on a 404 or leaves the site.
function safeRedirectPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return PORTAL_HOME;
  const path = raw.split(/[?#]/)[0];
  return path === PORTAL_HOME || path.startsWith(`${PORTAL_HOME}/`)
    ? raw
    : PORTAL_HOME;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        return;
      }
      router.push(safeRedirectPath(searchParams.get("from")));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        {/* Sized by height alone so a new shop's logo keeps its own shape —
            see lib/shop.ts. */}
        {SHOP_LOGO && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={SHOP_LOGO} alt="" className="mx-auto mb-1 h-24 w-auto" />
        )}
        <CardDescription className="text-center">
          Enter the shop password to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading || password.length === 0}
            className="w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col bg-muted/30">
      <main className="flex flex-1 items-center justify-center p-4">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
      <footer className="flex flex-col items-center gap-1.5 py-5">
        <Image
          src="/nexivo-studio.png"
          alt="Nexivo Studio"
          width={381}
          height={210}
          className="h-6 w-auto opacity-80"
        />
        <p className="text-center text-xs text-muted-foreground">
          System by NexivoStudio.io
        </p>
      </footer>
    </div>
  );
}
