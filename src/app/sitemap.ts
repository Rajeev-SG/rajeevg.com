import type { MetadataRoute } from "next"
import { getGlossaryRoutes, getHubRoutes } from "@/lib/content-ops/data"
import { getPostEffectiveDate } from "@/lib/posts"
import { getVisiblePostsLive } from "@/lib/server-posts"
import { site } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.siteUrl.replace(/\/$/, "")
  const posts = getVisiblePostsLive()
  const items: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
    { url: `${base}/projects`, lastModified: new Date() },
    { url: `${base}/blog`, lastModified: new Date() },
    { url: `${base}/dashboard`, lastModified: new Date() },
    ...getHubRoutes().map((record) => ({
      url: `${base}${record.url}`,
      lastModified: new Date(),
    })),
    { url: `${base}/glossary`, lastModified: new Date() },
    ...getGlossaryRoutes().map((record) => ({
      url: `${base}${record.url}`,
      lastModified: new Date(),
    })),
    { url: `${base}/privacy`, lastModified: new Date() },
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(getPostEffectiveDate(p)),
    })),
  ]
  return items
}
