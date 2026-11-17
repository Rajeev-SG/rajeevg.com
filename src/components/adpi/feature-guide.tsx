import Link from "next/link"
import { Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { explorerPath, type FeatureGuide as Guide } from "@/lib/adpi/feature-pages"
import { CONTROL_MODE_CLASS, CONTROL_MODE_LABEL } from "@/lib/adpi/labels"

const linkStyle = "text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-current"
const headingStyle = "text-xl font-semibold tracking-tight sm:text-2xl"

export function FeatureGuide({ guide }: { guide: Guide }) {
  const sourceNumbers = new Map(guide.sources.map(({ url }, index) => [url, index + 1]))
  const checkedAt = guide.checkedAt ? new Date(guide.checkedAt) : null

  function References({ urls }: { urls?: string[] }) {
    return [...new Set(urls)].map((url) => {
      const number = sourceNumbers.get(url)
      return number ? (
        <sup key={url} className="ms-1">
          <a className={linkStyle} href={`#source-${number}`} aria-label={`Source ${number}`}>[{number}]</a>
        </sup>
      ) : null
    })
  }

  function Items({ items, numbered = false }: { items: Guide["inputs"]; numbered?: boolean }) {
    if (items.length === 0) return null
    const List = numbered ? "ol" : "ul"
    return (
      <List className={`space-y-2 pl-5 leading-relaxed ${numbered ? "list-decimal" : "list-disc"}`}>
        {items.map((item, index) => (
          <li key={index}>{item.text}<References urls={item.sources} /></li>
        ))}
      </List>
    )
  }

  function Cards({ items, muted = false }: { items: Guide["inputs"]; muted?: boolean }) {
    if (!items.some((item) => item.title)) return <Items items={items} />
    return (
      <ul className={`grid gap-3 sm:grid-cols-2 ${muted ? "lg:grid-cols-3" : ""}`}>
        {items.map((item, index) => (
          <li key={index} className={`space-y-1 rounded-xl p-4 ${muted ? "bg-muted/60" : "border"}`}>
            <h3 className="text-sm font-semibold">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.text}<References urls={item.sources} /></p>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <article className="mx-auto max-w-[55rem] min-w-0 space-y-8 sm:space-y-10" data-testid="adpi-guide">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Feature breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link className={linkStyle} href={explorerPath}>Explorer</Link>
          {[guide.vendor, guide.platform !== guide.vendor ? guide.platform : undefined, guide.category]
            .filter(Boolean).map((part) => (
              <span key={part} className="flex items-center gap-2"><span aria-hidden="true">/</span>{part}</span>
            ))}
        </nav>
        <form action={explorerPath} role="search" className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
          <Input type="search" name="q" aria-label="Search features" placeholder="Search features on any platform" className="h-11 pl-9" />
        </form>
      </div>

      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.5rem] sm:leading-tight">{guide.name}</h1>
        <p className="max-w-3xl text-lg leading-relaxed">
          {guide.summary?.text || "Not documented"}<References urls={guide.summary?.sources} />
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          {guide.control && (
            <Badge className={`max-w-full rounded-full px-2.5 py-1 whitespace-normal ${CONTROL_MODE_CLASS[guide.control]}`}>
              {guide.controlLabel ?? CONTROL_MODE_LABEL[guide.control]}
            </Badge>
          )}
          {guide.availability && <span>{guide.availability}</span>}
          <span>
            Sources checked{" "}
            {checkedAt && !Number.isNaN(checkedAt.valueOf())
              ? <time dateTime={guide.checkedAt?.slice(0, 10)}>{checkedAt.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" })}</time>
              : <span className="lowercase">Not documented</span>}
          </span>
        </div>
      </header>

      <dl aria-label="Quick facts" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
        {guide.facts.map(({ label, value }) => (
          <div key={label} className="space-y-1 bg-secondary px-4 py-3.5">
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="space-y-3">
        <h2 className={headingStyle}>What you can give it</h2>
        <Cards items={guide.inputs} />
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="space-y-3">
          <h2 className={headingStyle}>Use it when</h2>
          <Items items={guide.useCases} />
        </section>
        <section className="space-y-3">
          <h2 className={headingStyle}>Don’t rely on it when</h2>
          <Items items={guide.limitations} />
        </section>
      </div>

      <section className="space-y-3">
        <h2 className={headingStyle}>Set it up</h2>
        <Items items={guide.steps} numbered />
      </section>

      <section className="space-y-3">
        <h2 className={headingStyle}>What it can move</h2>
        <Cards items={guide.kpis} muted />
      </section>

      {guide.comparisons.length > 0 && (
        <section className="space-y-3" aria-labelledby="other-platforms">
          <h2 id="other-platforms" className={headingStyle}>On other platforms</h2>
          <div className="overflow-x-auto rounded-xl border" role="region" aria-label="Platform comparisons" tabIndex={0}>
            <table aria-labelledby="other-platforms" className="w-full min-w-[36rem] text-sm [&_td]:p-3 [&_td]:align-top [&_td]:whitespace-normal [&_th]:px-3">
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead scope="col">Platform</TableHead>
                  <TableHead scope="col">Closest feature</TableHead>
                  <TableHead scope="col">Match</TableHead>
                  <TableHead scope="col" className="whitespace-normal">{guide.comparisonHeading ?? "How it differs"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guide.comparisons.map(({ vendor, name, href, match, details }) => (
                  <TableRow key={`${vendor}-${name}`}>
                    <TableCell className="font-medium">{vendor}</TableCell>
                    <TableCell>{href ? <Link href={href} className={linkStyle}>{name}</Link> : name}</TableCell>
                    <TableCell>{match}</TableCell>
                    <TableCell>{details?.text}<References urls={details?.sources} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
        </section>
      )}

      <footer className="space-y-2 border-t pt-5 text-sm">
        <h2 className="font-semibold">Sources</h2>
        {guide.sources.length > 0 ? (
          <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
            {guide.sources.map(({ url, label }, index) => (
              <li key={url} id={`source-${index + 1}`} className="scroll-mt-20">
                <a className={linkStyle} href={url}>{label}</a>
              </li>
            ))}
          </ol>
        ) : <p className="text-muted-foreground">Not documented</p>}
      </footer>
    </article>
  )
}
