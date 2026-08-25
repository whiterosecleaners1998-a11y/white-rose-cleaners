/**
 * The public origin of the current request, for building absolute links that
 * leave the app — receipt URLs pasted into WhatsApp, mainly.
 *
 * Read from the request rather than an env var so preview deployments, the
 * production domain and localhost each produce a link back to themselves with
 * nothing to configure.
 */
export function originFromHeaders(headers: Headers): string {
  // A reverse proxy in front of the app (Hostinger's router, nginx, Vercel)
  // rewrites Host to the internal target and puts the public name in
  // x-forwarded-host, so prefer that where it is present.
  const host =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
  // TLS is terminated ahead of the app, so the proto header is the honest one.
  // Falling back by host keeps plain-http local dev working.
  const proto =
    headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}
