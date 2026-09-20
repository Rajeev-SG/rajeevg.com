"use client"

import { Badge } from "@/components/ui/badge"
import type { AnswerCondition, QualifiedAnswer } from "@/lib/adpi/types"
import {
  AVAILABILITY_CLASS,
  AVAILABILITY_LABEL,
  CONDITION_KIND_LABEL,
  CONTROL_MODE_CLASS,
  CONTROL_MODE_LABEL,
  EVIDENCE_BASIS_LABEL,
} from "@/lib/adpi/labels"

function ConditionList({ conditions }: { conditions: AnswerCondition[] }) {
  if (conditions.length === 0) {
    return <p className="text-sm text-muted-foreground">No stated conditions.</p>
  }
  return (
    <ul className="space-y-1">
      {conditions.map((condition, index) => (
        <li key={`${condition.kind}-${index}`} className="flex gap-2 text-sm">
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {CONDITION_KIND_LABEL[condition.kind] ?? condition.kind}
          </span>
          <span>{condition.detail}</span>
        </li>
      ))}
    </ul>
  )
}

const PROVENANCE_LABEL: Record<string, string> = {
  live: "From the live published corpus",
  bundled: "From the bundled reviewed seed (live feed unavailable)",
  reviewed_reference: "Reviewed reference — no live record yet",
  none: "No source asserted this",
}

const PROVENANCE_CLASS: Record<string, string> = {
  live: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  bundled: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  reviewed_reference: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  none: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
}

/**
 * Where this answer came from, stated plainly so synthetic provenance is never
 * shown as live output (#163).
 */
function ProvenanceLabel({ provenance }: { provenance?: string }) {
  if (!provenance) return null
  const label = PROVENANCE_LABEL[provenance] ?? provenance
  return (
    <Badge
      variant="outline"
      className={PROVENANCE_CLASS[provenance] ?? ""}
      data-testid="adpi-provenance"
    >
      {label}
    </Badge>
  )
}

/**
 * The qualified answer for one planner question (#57): supported / conditional /
 * unknown, never a boolean, with the structured conditions, evidence basis,
 * evidence reference and verification date, or an explicit abstention.
 */
export function QualifiedAnswerCard({ answer }: { answer: QualifiedAnswer }) {
  if (answer.abstained || answer.facts.length === 0) {
    return (
      <div
        data-testid="adpi-abstention"
        className="rounded-xl border border-slate-500/40 bg-slate-500/5 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-slate-500/10 text-slate-700 dark:text-slate-400">
            Unknown — no answer asserted
          </Badge>
          <ProvenanceLabel provenance={answer.provenance} />
        </div>
        <p className="mt-3 text-sm leading-7">{answer.rationale}</p>
      </div>
    )
  }

  return (
    <div data-testid="adpi-qualified-answer" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={AVAILABILITY_CLASS[answer.verdict]}
          data-testid="adpi-verdict"
        >
          {AVAILABILITY_LABEL[answer.verdict]}
        </Badge>
        <ProvenanceLabel provenance={answer.provenance} />
        <span className="text-sm text-muted-foreground">{answer.rationale}</span>
      </div>

      {answer.facts.map((fact) => (
        <div key={fact.record.id} className="rounded-xl border p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-medium">{fact.record.name}</h4>
            <span className="text-xs text-muted-foreground">
              {fact.record.vendor} · {fact.record.platform}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="outline" className={CONTROL_MODE_CLASS[fact.record.control_mode]}>
              {CONTROL_MODE_LABEL[fact.record.control_mode]}
            </Badge>
            <Badge variant="outline" className={AVAILABILITY_CLASS[fact.record.availability]}>
              {AVAILABILITY_LABEL[fact.record.availability]}
            </Badge>
            <Badge variant="secondary">
              Evidence basis: {EVIDENCE_BASIS_LABEL[fact.record.evidence_basis]}
            </Badge>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Conditions
              </p>
              <div className="mt-1">
                <ConditionList conditions={fact.conditions} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Evidence
              </p>
              <div className="mt-1 space-y-1 text-sm">
                <p>
                  Verified:{" "}
                  <span className="font-medium">{fact.verificationDate ?? "unknown"}</span>
                </p>
                {fact.evidence.map((pointer) => (
                  <p key={pointer.source_id} className="break-all">
                    <a
                      className="underline underline-offset-4"
                      href={pointer.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {pointer.source_id}
                    </a>
                    <span className="ml-1 text-xs text-muted-foreground">
                      {pointer.cleaned_sha256.slice(0, 12)}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
