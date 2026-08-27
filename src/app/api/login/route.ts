import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth";
import { verifyShopPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({ password: "" }));

  const check = await verifyShopPassword(
    typeof password === "string" ? password : ""
  );

  if (!check.ok) {
    if (check.reason === "unconfigured") {
      return NextResponse.json(
        { error: "Server is not configured. Set APP_PASSWORD." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

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
