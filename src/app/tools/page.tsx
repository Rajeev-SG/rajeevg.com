import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const projects = [
  { name: "GTM Site Speed", href: "https://gtm-site-speed.rajeevg.com/", imgSrc: "/gtm-site-speed.png" },
  { name: "Project Two", href: "#", imgSrc: "/globe.svg" },
  { name: "Project Three", href: "#", imgSrc: "/file.svg" },
]

export default function ToolsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
      <p className="text-muted-foreground">A growing collection of projects and utilities.</p>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.name}>
            <Link href={p.href} className="block group focus:outline-none">
              <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
                <div className="relative h-36 w-full bg-muted">
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
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
