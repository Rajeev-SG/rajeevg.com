import { ContentOpsDashboard } from "@/components/content-ops/content-ops-dashboard"
import { getContentOpsData } from "@/lib/content-ops/data"

export default async function DashboardPage() {
  const data = await getContentOpsData()

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Content operations</p>
        <h1 className="text-3xl font-semibold tracking-tight">Workbook-backed content OS</h1>
        <p className="max-w-3xl text-muted-foreground">
          The spreadsheet is now the strategy seed, not the working surface. This dashboard mirrors each tab, adds
          workflow state, research packs, editor access, and queues the next content opportunities derived from the
          current site.
        </p>
      </div>

      <ContentOpsDashboard tabs={data.tabs} summary={data.summary} providerOptions={data.providerOptions} />
    </section>
  )
}
