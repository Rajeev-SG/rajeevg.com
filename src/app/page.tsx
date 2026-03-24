import type { Metadata } from "next";
import { MDXContent } from "@/components/mdx-content";
import { mdxComponents } from "@/components/mdx-components";
import { ReadingProgress } from "@/components/reading-progress";
import MermaidInit from "@/components/mermaid-init";
import { MermaidTooltips } from "@/components/mermaid-tooltips";
import { site } from "@/lib/site";
import { getPostEffectiveDate, getSortedVisiblePosts } from "@/lib/posts";

export const revalidate = 3600;

export default function Home() {
  const latest = getSortedVisiblePosts()[0]
  const latestDisplayDate = latest ? getPostEffectiveDate(latest) : null

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
      <article
        className="-mt-4 space-y-6 md:-mt-5"
        data-analytics-section="home_featured_post"
        data-analytics-item-type="post"
        data-analytics-item-id={latest.slug}
        data-analytics-item-name={latest.title}
        data-analytics-page-context="primary"
        data-analytics-page-content-group="blog"
        data-analytics-page-content-type="featured_article"
        data-analytics-page-content-id={latest.slug}
        data-analytics-page-content-name={latest.title}
        data-analytics-page-published-at={latest.date}
        data-analytics-page-tag-count={latest.tags.length}
        data-analytics-page-content-tags={latest.tags.join("|")}
      >
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{latest.title}</h1>
          {latest.description ? (
            <p className="text-muted-foreground">{latest.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {latest.updated ? "Updated " : ""}
            {latestDisplayDate ? new Date(latestDisplayDate).toLocaleDateString() : null}
          </p>
        </header>
        <section
          id="article-content"
          className="relative prose-sm sm:prose-base prose-headings:scroll-mt-24 prose-pre:rounded-lg dark:prose-invert"
          data-analytics-section="home_article_content"
          data-analytics-item-type="post_body"
          data-analytics-item-id={latest.slug}
          data-analytics-item-name={latest.title}
        >
          <MDXContent code={latest.code} components={mdxComponents} />
        </section>
        <MermaidInit />
        <MermaidTooltips />
      </article>
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const latest = getSortedVisiblePosts()[0]

  if (!latest) {
    return {
      title: site.name,
      description: site.description,
      alternates: { canonical: "/" },
    }
  }
  return {
    title: site.name,
    description: site.description,
    alternates: {
      canonical:
        site.homeCanonicalStrategy === "latest-post"
          ? `/blog/${latest.slug}`
          : `/`,
    },
  }
}
