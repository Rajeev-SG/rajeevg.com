import Link from "next/link";
import { Button } from "@/components/ui/button";
import { posts, type Post } from "#velite";

export default function Home() {
  const docs = posts
    .filter((p: Post) => process.env.NODE_ENV !== "production" || !p.draft)
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  return (
    <>
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground">Stuff I'm interested in (mainly technology)</p>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/blog">Read the blog</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blog">View all posts</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Latest posts</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((p) => (
            <li key={p.slug} className="rounded-lg border p-4">
              <Link href={`/blog/${p.slug}`} className="font-medium hover:underline">
                {p.title}
              </Link>
              {p.description && (
                <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(p.date).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
