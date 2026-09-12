import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Github } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  capabilityRows,
  corpusTasks,
  latencyRows,
  microbench,
} from "@/data/web-automation-microbench"
import { site } from "@/lib/site"

export const revalidate = 3600

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })

export const metadata: Metadata = {
  title: "Web automation tool leaderboard",
  description:
    "Head-to-head results for 33 browser automation tools on the same task: who finishes reliably, quickly, cheaply, and with the least AI overhead.",
  alternates: { canonical: "/solutions/web-automation-leaderboard" },
  openGraph: {
    title: `Web automation tool leaderboard • ${site.name}`,
    description:
      "Head-to-head results for 33 browser automation tools racing the same job, plus a real-work capability ranking that reorders them.",
    url: `${site.siteUrl}/solutions/web-automation-leaderboard`,
  },
}

function StatusPill({ value }: { value: string }) {
  const [passed, total] = value.split("/").map(Number)
  const tone =
    passed === total ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
      : passed === 0 ? "border-red-500/40 text-red-700 dark:text-red-400"
      : "border-amber-500/40 text-amber-700 dark:text-amber-400"
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums ${tone}`}>{value}</span>
}

export default function WebAutomationLeaderboardPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Web automation microbench leaderboard",
    description:
      "Ranks browser automation tools on identical tasks by reliability, speed, token cost, and real-work capability.",
    url: `${site.siteUrl}/solutions/web-automation-leaderboard`,
    dateModified: microbench.evidenceDate,
    creator: { "@type": "Person", name: "Rajeev Gill" },
    isBasedOn: microbench.repoUrl,
  }

  return (
    <section className="space-y-10" data-analytics-section="web_automation_leaderboard" data-analytics-item-type="tool">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Solutions · Benchmarks</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Web automation tool leaderboard</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          {microbench.harnesses} browser automation tools, one identical job, one independent pass test. Two rankings:
          fast-path speed and cost on a controlled microbenchmark, and real-work capability on 11 harvested tasks.
          They disagree, and that is the point.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="outline">Evidence date: {dateFormatter.format(new Date(microbench.evidenceDate))}</Badge>
          <Badge variant="outline">Model: {microbench.model}</Badge>
          <Badge variant="outline">{microbench.runs} scored runs</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <a href={microbench.repoUrl} target="_blank" rel="noreferrer noopener">
              <Github className="size-4" /> Full benchmark repo
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/blog/web-automation-microbenchmarks">
              Read the write-up <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">The job every tool had to do</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-foreground/90 sm:text-base">
          <p>
            On the public TodoMVC demo app: add two to-dos (&ldquo;Email supplier&rdquo; and &ldquo;Review invoice&rdquo;),
            tick off only the first, switch to the <em>Active</em> filter, and confirm only &ldquo;Review invoice&rdquo; is
            showing with &ldquo;1 item left&rdquo;.
          </p>
          <p className="text-muted-foreground">
            Passing is checked by independent code reading the page and the app&rsquo;s saved data — never by the agent&rsquo;s
            own say-so. The stopwatch covers only the model-plus-browser work, and failed runs are kept, never retried away.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Fast-path leaderboard</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            One row per harness and best-model combination, sorted by median time. Thin harnesses that let the model issue
            one native command per step win on speed and cost; heavyweight agent runtimes cost 10–100× more wall-clock for
            no accuracy gain. Rows marked <em>scored failure</em> reached the page but could not finish the job.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Harness</TableHead>
                <TableHead className="text-right">Pass</TableHead>
                <TableHead className="text-right">Median</TableHead>
                <TableHead className="text-right whitespace-nowrap">Tokens in/out</TableHead>
                <TableHead className="text-right whitespace-nowrap">Cost / run</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latencyRows.map((row, index) => (
                <TableRow key={`${row.repo}-${row.round}`}>
                  <TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
                  <TableCell>
                    <a className="font-medium underline-offset-4 hover:underline" href={row.url} target="_blank" rel="noreferrer noopener">
                      {row.harness}
                    </a>
                    <p className="text-xs text-muted-foreground">{row.repo} · round {row.round}</p>
                    {row.note ? <p className="mt-1 text-xs text-muted-foreground">{row.note}</p> : null}
                  </TableCell>
                  <TableCell className="text-right"><StatusPill value={row.pass} /></TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{row.median}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{row.tokens}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{row.cost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Real-work capability leaderboard</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            The same harness set scored on 11 real, provenance-backed browser tasks harvested from recorded sessions — tag
            inspection, script inventory, SEO audits, crawlability, canvas creation, and consent-to-add-to-cart journeys.
            The latency ranking and the capability ranking genuinely disagree: the fastest tool is the weakest on real work.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Harness</TableHead>
                <TableHead className="text-right whitespace-nowrap">Fast-path</TableHead>
                <TableHead className="text-right">Real-work</TableHead>
                <TableHead className="text-right whitespace-nowrap">Reps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capabilityRows.map((row) => (
                <TableRow key={row.repo}>
                  <TableCell>
                    <a className="font-medium underline-offset-4 hover:underline" href={row.url} target="_blank" rel="noreferrer noopener">
                      {row.harness}
                    </a>
                    <p className="text-xs text-muted-foreground">{row.repo}</p>
                    {row.note ? <p className="mt-1 text-xs text-muted-foreground">{row.note}</p> : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{row.fastPath}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{row.capability}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{row.reps}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2 pt-2">
          <h3 className="text-lg font-semibold tracking-tight">Per-task difficulty</h3>
          <p className="text-sm leading-7 text-muted-foreground">
            Pass counts across all harnesses. One-shot &ldquo;inspect the live page and report&rdquo; audits converge on
            almost any harness that can evaluate JavaScript; multi-step journeys and canvas construction sit above the
            current frontier.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Capability</TableHead>
                <TableHead className="text-right whitespace-nowrap">Passes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corpusTasks.map((task) => (
                <TableRow key={task.task}>
                  <TableCell className="font-mono text-xs sm:text-sm">{task.task}</TableCell>
                  <TableCell className="text-muted-foreground">{task.capability}</TableCell>
                  <TableCell className="text-right tabular-nums">{task.passes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Read it honestly</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-7 text-foreground/90 sm:text-base">
          <p>
            This ranks the <em>latency microbenchmark</em> (one controlled instrument) and a <em>real-work capability</em> suite
            (11 harvested tasks) as two separate claims. TodoMVC never feeds the capability number, and a 2-rep screening result
            should not be ordered finely against another 2-rep row.
          </p>
          <p className="text-muted-foreground">
            The benchmark repo is the source of truth; this page is a dated snapshot of it. Full contracts, raw per-run JSON,
            and the exclusion log live at{" "}
            <a className="font-medium underline underline-offset-4" href={microbench.repoUrl} target="_blank" rel="noreferrer noopener">
              {microbench.repoUrl.replace("https://", "")}
            </a>.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
