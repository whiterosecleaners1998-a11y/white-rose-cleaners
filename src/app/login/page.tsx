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

// Routes a signed-in user may be sent back to. Anything else — an off-site URL,
// a protocol-relative "//evil.com", or a typo'd path like "/l" — falls back to "/"
// so a successful login never lands on a 404 or leaves the site.
const RETURNABLE_PATHS = ["/orders", "/search", "/settings/prices", "/bookings/"];

function safeRedirectPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  const path = raw.split(/[?#]/)[0];
  if (path === "/") return raw;
  return RETURNABLE_PATHS.some((allowed) => path.startsWith(allowed)) ? raw : "/";
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
        <Image
          src="/logo.png"
          alt="White Rose Drycleaners"
          width={800}
          height={595}
          className="mx-auto mb-1 h-24 w-auto"
          priority
        />
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
      <footer className="py-4">
        <p className="text-center text-xs text-muted-foreground">
          Designed and Developed By Nexivostudio.io
        </p>
      </footer>
    </div>
  );
}
