import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/**
 * Everything the counter uses lives under one of these two prefixes, and
 * everything outside them is the public shop website.
 *
 * This used to be the other way round: locked by default, with a short list of
 * public paths. That was right when the portal *was* the site and the only
 * public thing was a receipt link. Now that the site is public and will keep
 * growing pages, an allowlist would mean every new page 302s to the login
 * screen until someone remembers to add it here.
 *
 * So the rule is the folder layout instead of a list: if it needs a session, it
 * belongs under src/app/portal or src/app/api. Nothing else is reachable from
 * the sidebar anyway, and a new page cannot quietly land on the wrong side of
 * the line without also being in the wrong folder.
 */
const PROTECTED_PREFIXES = ["/portal", "/api"];

/**
 * The endpoints inside /api that have to answer before a session exists, and
 * the methods they answer for.
 *
 * Listed by method rather than by path alone: /api/requests takes a pickup
 * request from a stranger, but reading, editing or deleting one is the
 * counter's business — those hold a customer's name, phone and home address.
 * Anything not named here stays behind the password.
 */
const PUBLIC_API: Record<string, readonly string[]> = {
  "/api/login": ["POST"],
  "/api/requests": ["POST"],
};

function isProtected(pathname: string, method: string): boolean {
  if (PUBLIC_API[pathname]?.includes(method)) return false;
  return PROTECTED_PREFIXES.some(
    // Guard the boundary so a public "/portals-we-love" page can never be
    // mistaken for the portal itself.
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname, request.method)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (session) {
    return NextResponse.next();
  }

  // An expired session on a fetch() call used to be answered with a redirect to
  // the login page, which arrives at the caller as a 200 full of HTML and blows
  // up in res.json(). The browser can read a 401; only a person needs the login
  // screen.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
