import type { CapabilityDataset } from "@/lib/adpi/types"

/**
 * A compact, honest freshness + coverage line for the live published corpus
 * (#60 / #163). It states what the feed itself says — record count, whether the
 * data was reconfirmed after verification, and the known gaps — instead of
 * inventing a freshness claim. Rendered only for the live dataset.
 */
export function AdpiFreshness({ dataset }: { dataset: CapabilityDataset }) {
  const coverage = dataset.coverage
  const records = dataset.capabilities
  const reconfirmed = records.filter((record) => record.reconfirmed).length
  const lastChecked = records
    .map((record) => record.last_checked_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)
  const gaps = coverage?.known_gaps
  const gapCount = gaps
    ? (gaps.unknown_availability ?? 0) + (gaps.unknown_maturity ?? 0)
    : 0

  const parts: string[] = []
  if (coverage?.record_count) parts.push(`${coverage.record_count.toLocaleString("en-GB")} records`)
  if (lastChecked) parts.push(`last checked ${lastChecked}`)
  if (reconfirmed > 0) parts.push(`${reconfirmed} reconfirmed since verification`)
  if (gapCount > 0) parts.push(`${gapCount.toLocaleString("en-GB")} known gaps (unknown availability/maturity)`)

  if (parts.length === 0) return null

  return (
    <p
      data-testid="adpi-freshness"
      className="text-xs leading-6 text-muted-foreground"
    >
      Coverage &amp; freshness: {parts.join(" · ")}. Publication time is not evidence
      freshness; each fact carries its own verification date.
    </p>
  )
}
