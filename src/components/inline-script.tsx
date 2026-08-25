/**
 * An inline script that runs while the browser parses the HTML, before first
 * paint — the only way to apply a stored preference without the default state
 * flashing first.
 *
 * The type juggling is the point. React warns whenever it *creates* a <script>
 * on the client, because such an element never executes, and it does create
 * this one: the root layout is re-rendered on client navigations, not just
 * hydrated. Marking the client-side render as `text/plain` puts the element
 * outside React's list of executable script types, which is exactly the case
 * it stays quiet about — and it is honest, since that copy genuinely cannot
 * run. The server keeps `text/javascript` so the copy that matters does.
 *
 * suppressHydrationWarning covers the resulting type mismatch, and nothing
 * else: it is shallow, so it never reaches the tree below.
 */
export default function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
