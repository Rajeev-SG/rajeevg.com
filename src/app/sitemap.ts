import type { MetadataRoute } from "next"

import { getPostEffectiveDate } from "@/lib/posts"
import { portfolioProjects } from "@/lib/portfolio-projects"
import { getVisiblePostsLive } from "@/lib/server-posts"
import { site } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.siteUrl.replace(/\/$/, "")
  const staticRoutes = [
    "/",
    "/about",
    "/solutions",
    "/solutions/earlier-products",
    "/blog",
    "/ai",
    "/analytics",
    "/privacy",
    "/contact",
    "/developers",
  ]

  const solutionRoutes = portfolioProjects.map((project) => ({
    url: `${base}/solutions/${project.slug}`,
    lastModified: new Date(project.lastUpdated),
  }))

  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })),
    ...solutionRoutes,
    ...getVisiblePostsLive().map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(getPostEffectiveDate(post)),
    })),
  ]
}
