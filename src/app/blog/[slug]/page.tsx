import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { posts, type Post } from "#velite"
import { MDXContent } from "@/components/mdx-content"
import { mdxComponents } from "@/components/mdx-components"
import { ReadingProgress } from "@/components/reading-progress"
import { site } from "@/lib/site"

 
function getPostBySlug(slug: string) {
  return posts.find((p: Post) => p.slug === slug)
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return notFound()

  const ogImage = post.image || site.defaultOgImage
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description || undefined,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
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
      <article className="space-y-6">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          {post.description ? (
            <p className="text-muted-foreground">{post.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {new Date(post.date).toLocaleDateString()}
          </p>
        </header>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <section id="article-content" className="prose-sm sm:prose-base prose-headings:scroll-mt-24 prose-pre:rounded-lg dark:prose-invert">
          <MDXContent code={post.code} components={mdxComponents} />
        </section>
      </article>
    </>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  const ogImage = post.image || site.defaultOgImage
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
  return posts.map((p: Post) => ({ slug: p.slug }))
}

