import Image from "next/image"
import Link from "next/link"
import { Github, Linkedin, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <section className="space-y-12" data-analytics-section="about_page" data-analytics-item-type="profile_page">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">About</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Rajeev Gill</h1>
        <p className="text-lg leading-8 text-muted-foreground sm:text-xl">
          I build practical software around AI, data, analytics, and adtech, usually with one question in mind: does this make the work less messy?
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-6 text-lg leading-8">
          <p>
            I am much more interested in useful systems than AI theatre. The work that keeps my attention is usually somewhere between product thinking and operations: AI-assisted software development, analytics and data platforms, adtech workflows, and tools that help a team stop improvising every week.
          </p>
          <p>
            A lot of what I build sits in the awkward middle where an idea has to survive contact with implementation. That means understanding the real workflow, making careful technical choices, and turning the result into something another person can use without a long explanation.
          </p>
          <p>
            This site is where I share the working version of that thinking: shipped projects, practical guides, and honest accounts of what held up once the software was running.
          </p>

          <div className="flex flex-wrap gap-3 pt-3">
            <Button asChild><Link href="mailto:rajeev.sgill@gmail.com"><Mail className="size-4" />Email</Link></Button>
            <Button asChild variant="outline"><Link href="https://github.com/Rajeev-SG" target="_blank" rel="noreferrer noopener"><Github className="size-4" />GitHub</Link></Button>
            <Button asChild variant="outline"><Link href="https://www.linkedin.com/in/rajeev-gill/" target="_blank" rel="noreferrer noopener"><Linkedin className="size-4" />LinkedIn</Link></Button>
          </div>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          <Image src="/rajeev-profile.jpg" alt="Portrait of Rajeev Gill" fill priority className="object-cover" sizes="(min-width: 1024px) 360px, 100vw" />
        </div>
      </div>
    </section>
  )
}
