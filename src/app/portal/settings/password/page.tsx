import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { passwordChangedAt } from "@/lib/password";
import PasswordForm from "./password-form";

export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  const changedAt = await passwordChangedAt();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Shop Password</CardTitle>
          <CardDescription>
            This is the password everyone at the counter signs in with. Changing
            it takes effect the next time anyone signs in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PasswordForm />
          <p className="text-xs text-muted-foreground">
            {changedAt
              ? `Last changed ${changedAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}.`
              : "Still the password the portal was set up with."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
