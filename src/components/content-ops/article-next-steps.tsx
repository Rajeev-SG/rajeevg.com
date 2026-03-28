import { ContentLinkCard } from "@/components/content-ops/content-link-card"
import type { ContentInventoryRecord } from "@/lib/content-ops/types"

type ArticleNextStepsProps = {
  current: ContentInventoryRecord
  related: ContentInventoryRecord[]
}

export function ArticleNextSteps({ current, related }: ArticleNextStepsProps) {
  if (!related.length) return null

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Next steps
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Move from {current.pageClass.toLowerCase()} into the rest of the system
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          This page now sits inside the {current.pillar} content graph. These are the most useful related proof,
          workflow, and concept nodes to read next.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {related.slice(0, 3).map((record) => (
          <ContentLinkCard key={record.id} record={record} />
        ))}
      </div>
    </section>
  )
}
