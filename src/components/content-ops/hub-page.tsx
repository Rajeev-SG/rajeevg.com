import { ContentLinkCard } from "@/components/content-ops/content-link-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ContentInventoryRecord } from "@/lib/content-ops/types"

type HubPageProps = {
  hub: ContentInventoryRecord
  spotlight: ContentInventoryRecord[]
  proof: ContentInventoryRecord[]
  glossary: ContentInventoryRecord[]
}

export function HubPage({ hub, spotlight, proof, glossary }: HubPageProps) {
  return (
    <section className="space-y-10">
      <Card className="border-border/70 bg-linear-to-br from-background via-background to-muted/40">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{hub.pageClass}</Badge>
            <Badge variant="outline">{hub.pillar}</Badge>
          </div>
          <CardTitle className="text-4xl tracking-tight">{hub.title}</CardTitle>
          <CardDescription className="max-w-3xl text-base leading-7">{hub.notes}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Spotlight pages</p>
            <p className="mt-2 text-3xl font-semibold">{spotlight.length}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Proof assets</p>
            <p className="mt-2 text-3xl font-semibold">{proof.length}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Concept nodes</p>
            <p className="mt-2 text-3xl font-semibold">{glossary.length}</p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Spotlight</p>
          <h2 className="text-2xl font-semibold tracking-tight">Best entry points for this hub</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {spotlight.map((record) => (
            <ContentLinkCard key={record.id} record={record} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Proof</p>
          <h2 className="text-2xl font-semibold tracking-tight">Projects, dashboards, and case-study nodes</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {proof.map((record) => (
            <ContentLinkCard key={record.id} record={record} />
          ))}
        </div>
      </section>

      {glossary.length ? (
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Concepts</p>
            <h2 className="text-2xl font-semibold tracking-tight">Bounded glossary nodes that support the hub</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {glossary.map((record) => (
              <ContentLinkCard key={record.id} record={record} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
