import type { Metadata } from "next"
import { unstable_noStore as noStore } from "next/cache"
import { notFound } from "next/navigation"

import { MDXContent } from "@/components/mdx-content"
import { mdxComponents } from "@/components/mdx-components"
import MermaidInit from "@/components/mermaid-init"
import { MermaidTooltips } from "@/components/mermaid-tooltips"
import { ReadingProgress } from "@/components/reading-progress"
import { RelatedReading } from "@/components/related-reading"
import { getPostEffectiveDate } from "@/lib/posts"
import {
  getRenderablePostBySlug,
  getSortedVisiblePostsLive,
  getVisiblePostSummaryBySlug,
  isLocalRuntimeOverlayEnabled,
} from "@/lib/server-posts"
import { site } from "@/lib/site"

export const dynamicParams = true

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  if (isLocalRuntimeOverlayEnabled()) noStore()
  const { slug } = await params
  const post = await getRenderablePostBySlug(slug)
  if (!post) return notFound()

  const ogImage = post.image || site.defaultOgImage
  const postDisplayDate = getPostEffectiveDate(post)
  const relatedPosts = getSortedVisiblePostsLive()
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => ({
      ...candidate,
      sharedTags: candidate.tags.filter((tag) => post.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.sharedTags - a.sharedTags || new Date(b.updated || b.date).getTime() - new Date(a.updated || a.date).getTime())
    .slice(0, 3)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description || undefined,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(postDisplayDate).toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${site.siteUrl}/blog/${post.slug}`,
    },
    author: [{ "@type": "Person", name: site.name }],
    image: [`${site.siteUrl}${ogImage}`],
  }

  return (
    <>
      <ReadingProgress />
      <article
        className="-mt-4 space-y-6 pb-40 md:-mt-5 md:pb-20"
        data-analytics-section="article_page"
        data-analytics-item-type="post"
        data-analytics-item-id={post.slug}
        data-analytics-item-name={post.title}
        data-analytics-page-context="primary"
        data-analytics-page-content-group="blog"
        data-analytics-page-content-type="article"
        data-analytics-page-content-id={post.slug}
        data-analytics-page-content-name={post.title}
        data-analytics-page-published-at={post.date}
        data-analytics-page-tag-count={post.tags.length}
        data-analytics-page-content-tags={post.tags.join("|")}
      >
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          {post.description ? <p className="text-muted-foreground">{post.description}</p> : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <p>
              {post.updated ? "Updated " : ""}
              {new Date(postDisplayDate).toLocaleDateString()}
            </p>
          </div>
        </header>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <section
          id="article-content"
          className="relative prose-sm sm:prose-base prose-headings:scroll-mt-24 prose-pre:rounded-lg dark:prose-invert"
          data-analytics-section="article_content"
          data-analytics-item-type="post_body"
          data-analytics-item-id={post.slug}
          data-analytics-item-name={post.title}
        >
          <MDXContent code={post.code} components={mdxComponents} />
        </section>
        <RelatedReading posts={relatedPosts} />
        <MermaidInit />
        <MermaidTooltips />
      </article>
    </>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getVisiblePostSummaryBySlug(slug)
  if (!post) return {}
  const ogImage = post.image || site.defaultOgImage
  const postDisplayDate = getPostEffectiveDate(post)
  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.description || site.description,
      publishedTime: new Date(post.date).toISOString(),
      modifiedTime: new Date(postDisplayDate).toISOString(),
      authors: [site.name],
      tags: post.tags,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description || site.description,
      images: [ogImage],
    },
  }
}

export function generateStaticParams() {
  return getSortedVisiblePostsLive().map((post) => ({ slug: post.slug }))
}
