import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

/**
 * Where the shop password lives.
 *
 * It starts life in APP_PASSWORD, which is all there was before this file. The
 * first time it is changed a hash lands in the database, and from then on the
 * database wins — the env var becomes dead weight that can be left alone or
 * cleared. Nothing ever stores the password in the clear.
 */

// One shop, one password: a fixed key rather than a row we have to go looking
// for, so a second row can never quietly appear and shadow the real one.
const CREDENTIAL_ID = "shop";

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

export { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH };

// Typed in on a phone as often as a keyboard, where an autocorrected accent can
// arrive composed one day and decomposed the next. Normalising both on the way
// in and on the way back means the same keystrokes always hash the same.
function normalize(password: string): string {
  return password.normalize("NFKC");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scryptAsync(normalize(password), salt, KEY_LENGTH);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

async function matchesHash(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;

  const key = await scryptAsync(
    normalize(password),
    Buffer.from(saltHex, "hex"),
    KEY_LENGTH
  );
  return timingSafeEqual(key, expected);
}

// The env fallback has no hash to compare against, so hash both sides on the
// spot — equal-length digests are what timingSafeEqual needs, and it keeps the
// comparison from leaking the password's length by how early it gives up.
function matchesEnvPassword(password: string, appPassword: string): boolean {
  const a = createHash("sha256").update(normalize(password)).digest();
  const b = createHash("sha256").update(normalize(appPassword)).digest();
  return timingSafeEqual(a, b);
}

export type PasswordCheck =
  | { ok: true }
  // No password anywhere: no row yet and no APP_PASSWORD. That is a deployment
  // problem, not a wrong guess, and the caller should say so differently.
  | { ok: false; reason: "wrong" | "unconfigured" };

export async function verifyShopPassword(
  password: string
): Promise<PasswordCheck> {
  const credential = await prisma.shopCredential.findUnique({
    where: { id: CREDENTIAL_ID },
  });

  if (credential) {
    return (await matchesHash(password, credential.passwordHash))
      ? { ok: true }
      : { ok: false, reason: "wrong" };
  }

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return { ok: false, reason: "unconfigured" };

  return matchesEnvPassword(password, appPassword)
    ? { ok: true }
    : { ok: false, reason: "wrong" };
}

export async function setShopPassword(password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  await prisma.shopCredential.upsert({
    where: { id: CREDENTIAL_ID },
    update: { passwordHash },
    create: { id: CREDENTIAL_ID, passwordHash },
  });
}

/** When the password was last changed, or null while APP_PASSWORD still answers. */
export async function passwordChangedAt(): Promise<Date | null> {
  const credential = await prisma.shopCredential.findUnique({
    where: { id: CREDENTIAL_ID },
    select: { updatedAt: true },
  });
  return credential?.updatedAt ?? null;
}
