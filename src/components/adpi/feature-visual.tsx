import Image from "next/image"
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react"

import type { Diagram, Example, FeatureVisual as Visual } from "@/lib/adpi/feature-visuals"

const imageDirectory = "/images/capability-explorer"

export const exampleKind = {
  library: "Public ad library",
  campaign: "Published campaign",
  documentation: "Official example",
}

export function ExampleImage({ example, compact = false }: { example: Example; compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-[#ecebe7] dark:bg-neutral-900 ${compact ? "h-36 sm:h-52" : "h-80 rounded-t-xl sm:h-[29rem]"}`}>
      <Image
        src={`${imageDirectory}/${example.image}`}
        alt={example.alt}
        fill
        className="object-contain p-2.5 sm:p-4"
        sizes={compact ? "(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 260px" : "(max-width: 920px) 95vw, 880px"}
        unoptimized
      />
    </div>
  )
}

function DiagramPanel({ diagram, featureId }: { diagram: Diagram; featureId: string }) {
  const { columns, rows, kind } = diagram
  const flow = kind === "flow"
  const scope = kind === "scope"

  return (
    <div className="rounded-t-xl bg-[#f3f2ed] px-4 py-5 text-[#252623] sm:px-6 sm:py-7 dark:bg-[#20211f] dark:text-[#f3f2ed]">
      <div className="hidden grid-cols-[1fr_1.25fr_1.2fr] gap-x-8 border-b border-black/15 pb-3 sm:grid dark:border-white/20" aria-hidden="true">
        {columns.map((column) => <span key={column} className="font-mono text-xs font-semibold uppercase tracking-wide">{column}</span>)}
      </div>
      <ul aria-label={diagram.title}>
        {rows.map(({ features, cells, outputImage }) => {
          const selected = features.includes(featureId)
          return (
            <li key={cells.join("|")} className="border-b border-black/15 py-4 last:border-b-0 last:pb-0 dark:border-white/20">
              <dl className={`grid gap-x-6 gap-y-2 sm:grid-cols-[1fr_1.25fr_1.2fr] sm:gap-x-8 ${flow ? "grid-cols-[1fr_1.2fr]" : ""}`}>
                {cells.map((cell, index) => (
                  <div key={columns[index]} className={`relative min-w-0 ${flow && index === 0 ? "col-span-2 sm:col-span-1" : ""}`}>
                    <div className={`${flow && index === 0 ? "sm:h-full" : "h-full"} ${flow ? "rounded-md border border-black/15 bg-white/70 p-3 dark:border-white/15 dark:bg-black/20" : ""}
                      ${selected && index === 0 ? "border-l-2 border-l-[#a94028] pl-2.5 dark:border-l-[#ff997c]" : ""}
                      ${scope && index === 1 ? "rounded-sm border border-dashed border-black/25 px-2.5 py-1.5 dark:border-white/25" : ""}`}>
                      <dt className="mb-0.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wide opacity-75 sm:sr-only">{columns[index]}</dt>
                      <dd className={`text-sm leading-snug ${index === 0 ? "font-semibold" : ""} ${index === 2 && selected ? "font-semibold text-[#8e321d] dark:text-[#ffb099]" : ""}`}>
                        {cell}
                        {index === 2 && outputImage && (
                          <Image src={`${imageDirectory}/${outputImage}`} width={160} height={120} alt="" unoptimized className="mt-2 h-auto w-24 rounded" />
                        )}
                      </dd>
                    </div>
                    {flow && index < 2 && (
                      <>
                        <ArrowRight aria-hidden="true" className={`absolute top-1/2 size-4 -translate-y-1/2 opacity-55 sm:-right-6 sm:block ${index === 0 ? "hidden" : "-right-5"}`} />
                        {index === 0 && <ArrowDown aria-hidden="true" className="mx-auto mt-2 size-4 opacity-55 sm:hidden" />}
                      </>
                    )}
                  </div>
                ))}
              </dl>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function FeatureVisual({ visual, featureId }: { visual: Visual; featureId: string }) {
  const diagram = "rows" in visual
  const sources = diagram ? visual.sources : [visual.source]

  return (
    <section aria-labelledby="feature-visual-heading" className="space-y-3">
      <h2 id="feature-visual-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">
        {diagram ? "How it works" : "See an example"}
      </h2>
      <figure className="rounded-xl border">
        {diagram ? <DiagramPanel diagram={visual} featureId={featureId} /> : <ExampleImage example={visual} />}
        <figcaption className="space-y-2 border-t px-4 py-4 text-sm sm:px-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong className="font-semibold">{visual.title}</strong>
            <span className="text-xs text-muted-foreground">
              {diagram ? "Configuration diagram" : exampleKind[visual.kind]}
            </span>
          </div>
          <p className="max-w-[65ch] text-muted-foreground">{visual.description}</p>
          {visual.note && <p className="max-w-[65ch] text-muted-foreground">{visual.note}</p>}
          <ul className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {!diagram && (
              <li>
                <a href={`${imageDirectory}/${visual.image}`} className="inline-flex min-h-7 items-center font-medium underline decoration-current/35 underline-offset-4 hover:decoration-current">
                  View full-size image
                </a>
              </li>
            )}
            {sources.map(({ url, label }) => (
              <li key={url}>
                <a href={url} className="inline-flex min-h-7 items-center gap-1 font-medium underline decoration-current/35 underline-offset-4 hover:decoration-current">
                  {label}<ArrowUpRight aria-hidden="true" className="size-3 shrink-0" />
                </a>
              </li>
            ))}
            {!diagram && (
              <li className="text-xs text-muted-foreground">
                Checked <time dateTime={visual.checkedAt}>{
                  new Date(visual.checkedAt).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" })
                }</time>
              </li>
            )}
          </ul>
        </figcaption>
      </figure>
    </section>
  )
}
