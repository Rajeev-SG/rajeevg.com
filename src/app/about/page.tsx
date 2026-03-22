import Image from "next/image"
import Link from "next/link"
import { Github, Linkedin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">About</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Rajeev Gill</h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          I work at the intersection of AI, data, analytics, and adtech with a bias toward
          practical systems that make real workflows easier to run.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/60">
            <CardContent className="space-y-5 p-6">
              <p>
                My focus is less on AI theatre and more on turning ideas into clear, useful
                outcomes. I am especially interested in LLM-assisted software development,
                analytics and data platforms, adtech workflows, and the systems that help teams go
                from scattered experiments to repeatable execution.
              </p>
              <p>
                A lot of what I build sits between strategy and implementation: workflow reviews,
                documentation-heavy systems, prompt and agent tooling, and small products that help
                people do operational work faster and with less friction.
              </p>
              <p>
                This site is where I publish ideas, working notes, and examples from that space,
                especially around practical AI adoption, software workflows, and the tools I am
                building along the way.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/70 bg-card/50">
              <CardContent className="space-y-3 p-6">
                <h2 className="text-lg font-semibold">Current focus</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>LLM-assisted software development workflows</li>
                  <li>AI systems that plug into existing business operations</li>
                  <li>Analytics, adtech, and data platform work</li>
                  <li>Documentation and knowledge tooling</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/50">
              <CardContent className="space-y-3 p-6">
                <h2 className="text-lg font-semibold">What I am building</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>A sharper blogging and publishing workflow</li>
                  <li>Prompt, documentation, and agent tooling</li>
                  <li>Apps Script services for bulk ad operations tasks</li>
                  <li>Practical systems for understanding and using AI agents</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="overflow-hidden border-border/70 bg-card/60">
            <div className="relative aspect-square">
              <Image
                src="/rajeev-profile.jpeg"
                alt="Portrait of Rajeev Gill"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 420px, 100vw"
              />
            </div>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-1">
                <p className="text-xl font-semibold">Practical AI, data, and workflow systems</p>
                <p className="text-sm text-muted-foreground">
                  Interested in advertising, AI, data, tech, and the operational side of making
                  tools genuinely useful.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="mailto:rajeev.sgill@gmail.com">
                    <Mail className="mr-2 size-4" /> Email
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href="https://github.com/Rajeev-SG"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Github className="mr-2 size-4" /> GitHub
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href="https://www.linkedin.com/in/rajeev-gill/"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Linkedin className="mr-2 size-4" /> LinkedIn
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  )
}
