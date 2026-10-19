/**
 * Which public paths may take part in Accept-based content negotiation.
 *
 * Negotiation turns a request for `/blog/post` into the markdown
 * representation when the client asks for it. Paths that are not articles must
 * be left alone: application routes, API routes, and anything that already
 * carries a file extension (a request for a `.html` file is a request for that
 * file, not for a negotiated representation of a page).
 *
 * `/interfaces` is the Visual AI Lab, a separate application served under this
 * site's origin by a rewrite. Negotiating it would rewrite the lab's HTML
 * into a markdown response.
 */
export function isNegotiablePublicPath(pathname: string): boolean {
  if (
    pathname === "/markdown-content" ||
    pathname.startsWith("/_next/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/trpc" ||
    pathname.startsWith("/trpc/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/interfaces" ||
    pathname.startsWith("/interfaces/") ||
    pathname.includes(".")
  ) {
    return false
  }

  return true
}
