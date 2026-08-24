import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">The page you are looking for does not exist. Try one of these canonical paths.</p>
      </div>
      <nav aria-label="Recovery links" className="grid gap-3 sm:grid-cols-2">
        <Link href="/" className="rounded-md border border-border px-4 py-3 underline underline-offset-4">Home</Link>
        <Link href="/projects" className="rounded-md border border-border px-4 py-3 underline underline-offset-4">Projects</Link>
        <Link href="/blog" className="rounded-md border border-border px-4 py-3 underline underline-offset-4">Writing</Link>
        <Link href="/sitemap.xml" className="rounded-md border border-border px-4 py-3 underline underline-offset-4">Sitemap</Link>
        <Link href="/llms.txt" className="rounded-md border border-border px-4 py-3 underline underline-offset-4">Agent guide</Link>
      </nav>
    </main>
  );
}
