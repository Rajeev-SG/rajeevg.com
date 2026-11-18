import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { ExampleImage, exampleKind } from "./feature-visual"
import { featurePath, type FeatureListing } from "@/lib/adpi/feature-pages"
import { examples, featuredExampleIds, libraryExamples } from "@/lib/adpi/visual-examples"

export function VisualGallery({ features }: { features: FeatureListing[] }) {
  const listings = new Map(features.map((feature) => [feature.id, feature]))
  const featured = featuredExampleIds.flatMap((id) => {
    const listing = listings.get(id)
    const example = examples[id]
    return listing && example ? [{ listing, example }] : []
  })

  if (!featured.length) return null

  return (
    <section aria-labelledby="ad-format-examples" className="space-y-3">
      <h2 id="ad-format-examples" className="text-xl font-semibold tracking-tight sm:text-2xl">Ad formats in practice</h2>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {featured.map(({ listing, example }) => (
          <li key={listing.id} className="overflow-hidden rounded-xl border">
            <Link href={featurePath(listing.id)} className="group flex h-full flex-col focus-visible:outline-2 focus-visible:-outline-offset-2">
              <ExampleImage example={example} compact />
              <div className="space-y-1.5 border-t p-2.5 sm:p-3.5">
                <p className="text-xs text-muted-foreground">{listing.vendor} · {exampleKind[example.kind]}</p>
                <p className="flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="group-hover:underline group-hover:underline-offset-4">{listing.name}</span>
                  <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
                </p>
                <p className="text-sm leading-snug text-muted-foreground">{example.title}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <details className="rounded-xl border px-4">
        <summary className="cursor-pointer py-3 text-sm font-medium">More ads from public libraries</summary>
        <ul className="grid gap-4 border-t py-4 sm:grid-cols-2">
          {libraryExamples.map((example) => (
            <li key={example.source.url} className="overflow-hidden rounded-lg border">
              <a href={example.source.url} className="group block h-full focus-visible:outline-2 focus-visible:-outline-offset-2">
                <ExampleImage example={example} compact />
                <div className="space-y-1 border-t p-3.5">
                  <p className="text-xs text-muted-foreground">{example.source.label}</p>
                  <p className="flex items-center justify-between gap-2 text-sm font-semibold">
                    <span className="group-hover:underline group-hover:underline-offset-4">{example.title}</span>
                    <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
                  </p>
                  <p className="text-sm leading-snug text-muted-foreground">{example.description}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
