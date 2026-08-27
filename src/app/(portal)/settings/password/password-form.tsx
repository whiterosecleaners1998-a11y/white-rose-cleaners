"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

export default function PasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // One switch for all three boxes: on a counter machine the point is to read
  // back what was typed, and hiding the other two while checking one is fuss.
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`The new password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The two new passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not change the password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setVisible(false);
      toast.success("Password changed.");
      // Repaints "last changed" without a reload.
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const fieldType = visible ? "text" : "password";

  return (
    <form onSubmit={handleSubmit} className="grid max-w-sm gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type={fieldType}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type={fieldType}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="confirmPassword">Repeat new password</Label>
        <Input
          id="confirmPassword"
          type={fieldType}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="justify-self-start px-2 text-muted-foreground"
        onClick={() => setVisible((shown) => !shown)}
      >
        {visible ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
        {visible ? "Hide passwords" : "Show passwords"}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={
          saving ||
          currentPassword.length === 0 ||
          newPassword.length === 0 ||
          confirmPassword.length === 0
        }
        className="justify-self-start"
      >
        {saving ? "Changing..." : "Change password"}
      </Button>
    </form>
  );
}
