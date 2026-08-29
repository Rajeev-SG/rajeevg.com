import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Rajeev Gill about practical software, AI, analytics, and adtech work.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return (
    <section className="space-y-12" data-analytics-section="contact_page" data-analytics-item-type="contact_page">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Bring the useful question.</h1>
        <p className="text-lg leading-8 text-muted-foreground sm:text-xl">
          For project conversations, practical AI and analytics work, collaboration, or questions about something published here, email me at <Link className="underline underline-offset-4" href="mailto:rajeev.sgill@gmail.com">rajeev.sgill@gmail.com</Link>.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
        <div className="space-y-6 text-lg leading-8">
          <h2 className="text-2xl font-semibold tracking-tight">Useful context to include</h2>
          <ul className="list-disc space-y-3 pl-6 text-muted-foreground">
            <li>What you are trying to build, measure, or understand.</li>
            <li>The relevant project, article, or live URL.</li>
            <li>The outcome, constraint, or decision you need help with.</li>
            <li>A realistic timeframe if the request is time-sensitive.</li>
          </ul>
          <p className="text-base text-muted-foreground">
            Please do not send passwords, private customer data, or confidential credentials. For privacy questions or corrections, use the same public email address and mention the relevant page.
          </p>
          <Button asChild><Link href="mailto:rajeev.sgill@gmail.com">Email Rajeev</Link></Button>
        </div>

        <aside className="border-l border-border pl-6 text-sm leading-7 text-muted-foreground">
          <p className="font-medium text-foreground">Related paths</p>
          <div className="mt-3 grid gap-2">
            <Link className="underline underline-offset-4" href="/solutions">Solutions</Link>
            <Link className="underline underline-offset-4" href="/blog">Writing</Link>
            <Link className="underline underline-offset-4" href="/developers">Developer resources</Link>
            <Link className="underline underline-offset-4" href="/privacy">Privacy policy</Link>
          </div>
          <p className="mt-8">This site is operated by Rajeev Gill at {site.siteUrl.replace(/^https?:\/\//, "")}.</p>
        </aside>
      </div>
    </section>
  )
}
