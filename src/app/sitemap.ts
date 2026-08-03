import type { MetadataRoute } from "next"

import { getPostEffectiveDate } from "@/lib/posts"
import { getVisiblePostsLive } from "@/lib/server-posts"
import { site } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.siteUrl.replace(/\/$/, "")
  const staticRoutes = [
    "/",
    "/about",
    "/projects",
    "/blog",
    "/ai",
    "/analytics",
    "/privacy",
    "/projects/site-analytics",
    "/projects/hackathon-voting-analytics/google-analytics",
  ]

  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })),
    ...getVisiblePostsLive().map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(getPostEffectiveDate(post)),
    })),
  ]
}
