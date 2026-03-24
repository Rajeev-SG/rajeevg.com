import type { MetadataRoute } from "next"
import { site } from "@/lib/site"
import { getPostEffectiveDate, getVisiblePosts } from "@/lib/posts"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.siteUrl.replace(/\/$/, "")
  const items: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
    { url: `${base}/projects`, lastModified: new Date() },
    { url: `${base}/blog`, lastModified: new Date() },
    { url: `${base}/privacy`, lastModified: new Date() },
    ...getVisiblePosts().map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(getPostEffectiveDate(p)),
    })),
  ]
  return items
}
