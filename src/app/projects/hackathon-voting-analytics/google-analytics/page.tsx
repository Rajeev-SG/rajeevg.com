import type { Metadata } from "next"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { hackathonEventDayReport as report } from "@/lib/hackathon-event-day-report"
import { site } from "@/lib/site"

const numberFormatter = new Intl.NumberFormat("en-GB")

export default function HackathonEventDayAnalyticsPage() {
  const metrics = [
    { label: "Official votes", value: report.officialVotes, note: "Application records" },
    { label: "Tracked submissions", value: report.trackedSubmissions, note: "GA4 events" },
    { label: "Analytics coverage", value: `${report.coverage}%`, note: "Tracked vs official votes" },
    { label: "Judges", value: report.judges, note: "Official unique judges" },
  ]

  return (
    <section className="space-y-12">
      <header className="max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Project report</p>
          <Badge variant="outline">Fixed event-day snapshot</Badge>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Hackathon event-day analytics</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          A fixed report for the voting event on <time dateTime={report.date}>{report.dateLabel}</time>. It compares the complete vote records from the application with the smaller set of browser events visible to optional analytics.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{typeof metric.value === "number" ? numberFormatter.format(metric.value) : metric.value}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{metric.note}</p></CardContent>
          </Card>
        ))}
      </div>

      <section className="max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Why the totals differ</h2>
        <p className="leading-7 text-muted-foreground">
          The voting application recorded all 297 official votes. Analytics recorded 172 submission events because it only saw activity when consent and browser conditions allowed it. The application records are therefore the source for final results; analytics is useful for understanding the event experience, not for recounting votes.
        </p>
      </section>

      <section className="space-y-5" aria-labelledby="entry-comparison">
        <div className="space-y-2">
          <h2 id="entry-comparison" className="text-2xl font-semibold tracking-tight">Entry comparison</h2>
          <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
            Stable project identifiers matched 163 analytics submissions to entries. Five other official-entry events did not carry a stable identifier, and four submissions were tests; all nine remain in the overall tracked total of 172.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 text-right font-medium">Official votes</th>
                <th className="px-4 py-3 text-right font-medium">Official average</th>
                <th className="px-4 py-3 text-right font-medium">Tracked submissions</th>
                <th className="px-4 py-3 text-right font-medium">Tracked average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.entries.map((entry) => (
                <tr key={entry.slug}>
                  <td className="px-4 py-3 font-medium">{entry.projectName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{entry.officialVotes}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{entry.officialAverageScore.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{entry.trackedSubmissions}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{entry.trackedAverageScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Consent snapshot</h2>
          <div className="divide-y divide-border rounded-xl border border-border">
            <div className="flex items-center justify-between p-4"><span>Analytics denied</span><strong>{report.consent.denied}</strong></div>
            <div className="flex items-center justify-between p-4"><span>Analytics granted</span><strong>{report.consent.granted}</strong></div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">These are page-context events, not people. They show why browser analytics should not be treated as the voting record.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Most frequent tracked events</h2>
          <div className="divide-y divide-border rounded-xl border border-border">
            {report.events.slice(0, 6).map((event) => (
              <div key={event.name} className="flex items-center justify-between gap-4 p-4 text-sm">
                <code className="break-all">{event.name}</code>
                <strong className="tabular-nums">{numberFormatter.format(event.count)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="text-sm text-muted-foreground">
        <Link href="/projects#hackathon-voting-app" className="underline underline-offset-4 hover:text-foreground">Back to the Hackathon Voting App project</Link>
      </p>
    </section>
  )
}

export const metadata: Metadata = {
  title: "Hackathon event-day analytics",
  description: "A fixed report comparing official hackathon votes with consent-aware analytics from 25 March 2026.",
  alternates: { canonical: "/projects/hackathon-voting-analytics/google-analytics" },
  openGraph: {
    title: `Hackathon event-day analytics • ${site.name}`,
    description: "Official voting totals and consent-aware analytics for the hackathon event on 25 March 2026.",
    url: `${site.siteUrl}/projects/hackathon-voting-analytics/google-analytics`,
  },
}
