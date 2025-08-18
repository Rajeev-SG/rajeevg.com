import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { posts, type Post } from "#velite"
import { MDXContent } from "@/components/mdx-content"
import { mdxComponents } from "@/components/mdx-components"

interface PostParamsAwaitable {
  params: Promise<{ slug: string }>
}

function getPostBySlug(slug: string) {
  return posts.find((p: Post) => p.slug === slug)
}

export default async function PostPage({ params }: PostParamsAwaitable) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return notFound()

  return (
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
      <section className="prose-sm sm:prose-base prose-headings:scroll-mt-24 prose-pre:rounded-lg dark:prose-invert">
        <MDXContent code={post.code} components={mdxComponents} />
      </section>
    </article>
  )
}

export async function generateMetadata({ params }: PostParamsAwaitable): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
  }
}

export function generateStaticParams() {
  return posts.map((p: Post) => ({ slug: p.slug }))
}
