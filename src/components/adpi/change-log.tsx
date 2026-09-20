import type { AdpiHistory } from "@/lib/adpi/history"
import { summariseHistory } from "@/lib/adpi/history"

const CHANGE_LABEL: Record<string, string> = {
  added: "Added",
  changed: "Changed",
  superseded: "Superseded",
  retired: "Retired",
}

/**
 * A concise "what changed" surface for the published fact history (#58).
 *
 * Framed for a planner: what has moved recently, and when the corpus was last
 * verified. It states only what the published history artefact asserts — it
 * never infers a change. Rendered only for the live dataset, and only when a
 * history artefact exists.
 */
export function AdpiChangeLog({ history }: { history: AdpiHistory }) {
  const summary = summariseHistory(history)
  if (summary.total === 0) return null

  const kinds = Object.entries(summary.byChange)
    .map(([kind, count]) => `${count} ${CHANGE_LABEL[kind] ?? kind}`)
    .join(" · ")

  return (
    <details
      className="group rounded-xl border p-3 sm:p-4"
      data-testid="adpi-changelog"
    >
      <summary className="cursor-pointer text-sm font-medium">
        What changed · {summary.total.toLocaleString("en-GB")} tracked fact versions
        {summary.lastVerifiedAt ? ` · last verified ${summary.lastVerifiedAt}` : ""}
      </summary>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
        <p>
          Fact history accrues from first observation: {kinds}. A version with no
          end date is still current; superseded and retired versions show where a
          fact stopped being current.
        </p>
        {summary.recentChanges.length > 0 ? (
          <ul className="space-y-1">
            {summary.recentChanges.map((entry) => (
              <li key={`${entry.id}-${entry.effective_to ?? "current"}-${entry.change}`}>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                  {CHANGE_LABEL[entry.change] ?? entry.change}
                </span>{" "}
                <span className="text-foreground">{entry.name}</span>{" "}
                <span>
                  ({entry.vendor}
                  {entry.effective_to ? `, ended ${entry.effective_to}` : ""}
                  {entry.changed_fields?.length
                    ? `, ${entry.changed_fields.join(", ")}`
                    : ""}
                  )
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No superseded or retired facts recorded yet.</p>
        )}
      </div>
    </details>
  )
}
