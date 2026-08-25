/**
 * The public origin of the current request, for building absolute links that
 * leave the app — receipt URLs pasted into WhatsApp, mainly.
 *
 * Read from the request rather than an env var so preview deployments, the
 * production domain and localhost each produce a link back to themselves with
 * nothing to configure.
 */
export function originFromHeaders(headers: Headers): string {
  const host = headers.get("host") ?? "localhost:3000";
  // Vercel terminates TLS ahead of the app, so the proto header is the honest
  // one. Falling back by host keeps plain-http local dev working.
  const proto =
    headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}
