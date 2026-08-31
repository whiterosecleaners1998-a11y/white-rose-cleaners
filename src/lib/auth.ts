import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "dc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Who a session belongs to.
 *
 * Today there is exactly one: the shop, holding the one shared password. The
 * subject is written down anyway so that adding customer logins later is a new
 * role and a real `sub`, not a reshaping of every session in circulation.
 */
export type SessionRole = "owner" | "customer";

export type Session = {
  /** "shop" for the counter; a customer id once customers can sign in. */
  sub: string;
  role: SessionRole;
};

/** The single shared login the counter uses. */
export const SHOP_SUBJECT = "shop";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  session: Session = { sub: SHOP_SUBJECT, role: "owner" }
): Promise<string> {
  return new SignJWT({ role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const role = payload.role === "customer" ? "customer" : "owner";
    // Sessions minted before subjects existed carry a role and nothing else.
    // They are still signed, still unexpired, and still the shop — reading them
    // as such means this change does not sign the counter out mid-shift.
    return { sub: payload.sub ?? SHOP_SUBJECT, role };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_TTL_SECONDS };
