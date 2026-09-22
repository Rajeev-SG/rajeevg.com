import type { Metadata } from "next"
import Link from "next/link"

import {
  SECTION_LABEL,
  getDurableGuideIndex,
  getGuideDetail,
  guideEntry,
  orderedSections,
} from "@/lib/adpi/guides"
import type { GuideClaim, GuideEvidenceRef, GuideStatus } from "@/lib/adpi/guide-types"

export const revalidate = 3600

const STATUS_LABEL: Record<GuideStatus, string> = {
  documented: "Documented",
  inferred: "Inferred",
  not_documented: "Not documented",
  not_applicable: "Not applicable",
  conflicting: "Conflicting",
}

function Citation({ refs }: { refs: GuideEvidenceRef[] }) {
  if (!refs || refs.length === 0) return null
  return (
    <span className="text-xs text-muted-foreground">
      {" "}
      —{" "}
      {refs.map((ref, i) => (
        <span key={`${ref.source_id}-${i}`}>
          {i > 0 ? ", " : ""}
          <a
            className="underline underline-offset-4"
            href={ref.source_url}
            target="_blank"
            rel="noreferrer noopener"
          >
            {ref.source_id}
            {ref.locator ? ` (${ref.locator})` : ""}
          </a>
        </span>
      ))}
    </span>
  )
}

function Claim({ claim }: { claim: GuideClaim }) {
  const absent = claim.status === "not_documented" || claim.status === "not_applicable"
  return (
    <li className="text-sm leading-7">
      <span className="text-muted-foreground">[{STATUS_LABEL[claim.status]}]</span> {claim.text}
      <Citation refs={claim.evidence} />
      {claim.conditions && claim.conditions.length > 0 ? (
        <span className="text-xs text-muted-foreground"> Conditions: {claim.conditions.join("; ")}</span>
      ) : null}
      {absent ? null : null}
    </li>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ featureId: string }>
}): Promise<Metadata> {
  const { featureId } = await params
  const index = await getDurableGuideIndex()
  const entry = index ? guideEntry(index, featureId) : null
  const title = entry ? `${entry.name} — feature guide` : "Feature guide"
  return { title, alternates: { canonical: `/solutions/capability-explorer/guides/${featureId}` } }
}

export default async function FeatureGuidePage({
  params,
}: {
  params: Promise<{ featureId: string }>
}) {
  const { featureId } = await params
  const index = await getDurableGuideIndex()
  const entry = index ? guideEntry(index, featureId) : null
  const detail = entry ? await getGuideDetail(entry.detail) : null
  if (!entry || !detail) {
    // Unguided features are an explicit, honest state, never a 404 or a blank
    // page (#116: "Keep unguided rows as 'Guide not yet available'").
    const title = entry?.name ?? featureId
    const reason = entry
      ? "The reviewed detail artifact could not be loaded; showing the last-known-good index entry."
      : "No reviewed guide exists for this feature yet."
    return (
      <section className="space-y-4" data-testid="adpi-guide-unavailable">
        <Link className="text-sm underline underline-offset-4" href="/solutions/capability-explorer">
          ← Back to the explorer
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          Guide not yet available for this feature. {reason}
        </p>
      </section>
    )
  }

  const guide = detail.guide
  const sections = orderedSections(guide.sections)
  const setupSection = sections.find((s) => s.kind === "setup")

  return (
    <article className="space-y-6" data-testid="adpi-guide">
      <Link className="text-sm underline underline-offset-4" href="/solutions/capability-explorer">
        ← Back to the explorer
      </Link>

      <header className="max-w-3xl space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {guide.vendor} · {guide.platform}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{guide.name}</h1>
        <p className="text-sm text-muted-foreground">
          Guide release {detail.release}
          {guide.source_checked_at ? ` · sources checked ${guide.source_checked_at.slice(0, 10)}` : ""}
          {guide.verified_at ? ` · verified ${guide.verified_at.slice(0, 10)}` : ""}
        </p>
      </header>

      {sections.map((section, sectionIndex) => (
        <section key={section.kind} className="max-w-3xl space-y-2" data-testid={`adpi-guide-section-${section.kind}`}>
          <h2 className="text-xl font-medium">
            {sectionIndex + 1}. {SECTION_LABEL[section.kind]}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              [{STATUS_LABEL[section.status]}]
            </span>
          </h2>
          {section.summary ? <p className="text-sm leading-7">{section.summary}</p> : null}
          {section.claims.length > 0 ? (
            <ol className="list-decimal space-y-1 pl-5">
              {section.claims.map((claim, i) => (
                <Claim key={i} claim={claim} />
              ))}
            </ol>
          ) : null}
        </section>
      ))}

      {setupSection && setupSection.claims.length > 0 ? (
        <p className="max-w-3xl text-xs text-muted-foreground">
          Setup steps above are shown only where the sources document them; a partial path is stated
          as partial and is never completed from assumption.
        </p>
      ) : null}

      {guide.relationships.length > 0 ? (
        <section className="max-w-3xl space-y-2" data-testid="adpi-guide-relationships">
          <h2 className="text-xl font-medium">Alternatives on other platforms</h2>
          <ul className="space-y-2">
            {guide.relationships.map((rel) => (
              <li key={rel.feature_id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">
                  {rel.name} ({rel.vendor}) — {rel.kind.replace(/_/g, " ")}
                </p>
                <p className="text-muted-foreground">{rel.difference}</p>
                <p className="text-xs text-muted-foreground">Context: {rel.context}</p>
                <Link
                  className="text-xs underline underline-offset-4"
                  href={`/solutions/capability-explorer/guides/${rel.feature_id}`}
                >
                  Open guide
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
