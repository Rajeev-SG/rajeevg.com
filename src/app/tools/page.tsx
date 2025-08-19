"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ExternalLink } from "lucide-react"

type Project = {
  name: string
  href: string
  imgSrc: string
  docsHref?: string
  tooltip?: string
}

const projects: Project[] = [
  {
    name: "GTM Site Speed",
    href: "https://gtm-site-speed.rajeevg.com/",
    imgSrc: "/gtm-site-speed.png",
    docsHref: "https://github.com/Rajeev-SG/gtm-site-speed",
    tooltip: "View docs on GitHub",
  },
  { name: "Project Two", href: "#", imgSrc: "/globe.svg" },
  { name: "Project Three", href: "#", imgSrc: "/file.svg" },
]

export default function ToolsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
      <p className="text-muted-foreground">A growing collection of projects and utilities.</p>

      <TooltipProvider delayDuration={200}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.name}>
              <Card className="relative overflow-hidden transition-shadow group hover:shadow-md">
                {/* Full-card link overlay (single anchor) */}
                <Link
                  href={p.href}
                  aria-label={`Open ${p.name}`}
                  className="absolute inset-0 z-10"
                >
                  <span className="sr-only">Open {p.name}</span>
                </Link>

                {/* Optional docs tooltip button (separate link, above overlay) */}
                {p.docsHref ? (
                  <div className="absolute right-2 top-2 z-20">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={p.docsHref}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={p.tooltip ?? `Open ${p.name} documentation`}
                          className="inline-flex items-center justify-center rounded-md border bg-background/80 px-2 py-1 text-xs text-foreground shadow-sm backdrop-blur hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ExternalLink className="mr-1 size-3.5" /> Docs
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="left">{p.tooltip ?? "Documentation"}</TooltipContent>
                    </Tooltip>
                  </div>
                ) : null}

                <div className="relative z-0 h-36 w-full bg-muted">
                  {/* Using Next/Image for optimized responsive images; swap placeholders with real screenshots */}
                  <Image
                    src={p.imgSrc}
                    alt={p.name}
                    fill
                    className="object-contain p-6 [background:linear-gradient(var(--card),var(--card))]"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">Click to view</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </TooltipProvider>
    </section>
  )
}
