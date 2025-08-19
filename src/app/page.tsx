import type { Metadata } from "next";
import { posts, type Post } from "#velite";
import { MDXContent } from "@/components/mdx-content";
import { mdxComponents } from "@/components/mdx-components";
import { ReadingProgress } from "@/components/reading-progress";

export default function Home() {
  const latest = posts
    .filter((p: Post) => process.env.NODE_ENV !== "production" || !p.draft)
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  if (!latest) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">No posts yet</h1>
        <p className="text-muted-foreground">Add a Markdown file under <code>content/posts/</code> to get started.</p>
      </section>
    )
  }

  return (
    <>
      <ReadingProgress />
      <article className="space-y-6">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{latest.title}</h1>
          {latest.description ? (
            <p className="text-muted-foreground">{latest.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {new Date(latest.date).toLocaleDateString()}
          </p>
        </header>
        <section id="article-content" className="prose-sm sm:prose-base prose-headings:scroll-mt-24 prose-pre:rounded-lg dark:prose-invert">
          <MDXContent code={latest.code} components={mdxComponents} />
        </section>
      </article>
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const latest = posts
    .filter((p: Post) => process.env.NODE_ENV !== "production" || !p.draft)
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  if (!latest) return {}
  return {
    title: latest.title,
    description: latest.description,
    alternates: {
      canonical: `/blog/${latest.slug}`,
    },
  }
}
