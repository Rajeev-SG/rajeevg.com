export const site = {
  /** Site title (used as default and in title template) */
  name: "Rajeev G.",
  /** Site tagline/description */
  description: "Data • Analytics • AdTech",
  /** Canonical site URL. Set NEXT_PUBLIC_SITE_URL in env; this is the fallback. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://rajeevg.com",
  /** Default Open Graph image served from /public. Recommended: add /og.png later. */
  defaultOgImage: "/gtm-site-speed.png",
  /**
   * How to compute the homepage canonical:
   * - "self": canonical is "/" (recommended)
   * - "latest-post": canonical points to the latest post's /blog/[slug]
   */
  homeCanonicalStrategy: (process.env.NEXT_PUBLIC_HOME_CANONICAL as "self" | "latest-post") || "self",
};
