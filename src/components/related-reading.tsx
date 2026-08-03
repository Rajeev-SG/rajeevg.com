import Link from "next/link"
import { ArrowRight } from "lucide-react"

type RelatedPost = {
  slug: string
  title: string
  description?: string
}

export function RelatedReading({ posts }: { posts: RelatedPost[] }) {
  if (!posts.length) return null

  return (
    <section className="space-y-5 border-t border-border pt-10" aria-labelledby="related-reading">
      <h2 id="related-reading" className="text-2xl font-semibold tracking-tight">Related reading</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex h-full flex-col rounded-xl border border-border p-5 transition-colors hover:bg-muted/50">
            <h3 className="font-semibold leading-6 group-hover:underline">{post.title}</h3>
            {post.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.description}</p> : null}
            <ArrowRight className="mt-auto size-4 pt-4 box-content" />
          </Link>
        ))}
      </div>
    </section>
  )
}
