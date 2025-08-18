import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">404 — Page not found</h1>
      <p className="text-muted-foreground mt-2">The page you are looking for doesnt exist.</p>
      <div className="mt-6">
        <Link href="/" className="underline underline-offset-4">
          Go back home
        </Link>
      </div>
    </main>
  );
}
