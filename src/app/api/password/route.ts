import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth";
import { setShopPassword, verifyShopPassword } from "@/lib/password";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

// Signed in is not enough to change the password: a counter left logged in is
// the whole risk, so the current password has to be typed out again here.
const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Enter the current password and a new one of at least ${MIN_PASSWORD_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const check = await verifyShopPassword(currentPassword);
  if (!check.ok) {
    if (check.reason === "unconfigured") {
      return NextResponse.json(
        { error: "Server is not configured. Set APP_PASSWORD." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "The current password is not right." },
      { status: 401 }
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "The new password is the same as the current one." },
      { status: 400 }
    );
  }

  await setShopPassword(newPassword);

  // Changing the password shouldn't sign the shop out of the screen they are
  // standing at, so hand back a fresh cookie. Sessions on other devices carry
  // on until they expire — the cookie is a signed session, not the password.
  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
