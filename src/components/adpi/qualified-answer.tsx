import { BasisBadge, ControlBadge, OutcomeBadge } from "./badges"
import { groupConditions } from "@/lib/adpi/qualify"
import type { QualifiedAnswer } from "@/lib/adpi/qualify"

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export function QualifiedAnswerCard({ answer }: { answer: QualifiedAnswer }) {
  const groups = groupConditions(answer.conditions)
  const capability = answer.capability
  return (
    <article
      className="rounded-xl border bg-card p-5 shadow-sm"
      data-analytics-item-type="capability_answer"
      data-analytics-item-id={capability.id}
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {capability.vendor} · {capability.platform}
          </p>
          <h3 className="text-lg font-semibold tracking-tight">{capability.name}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OutcomeBadge outcome={answer.outcome} />
          <ControlBadge mode={capability.control_mode} />
          <BasisBadge basis={answer.evidenceBasis} />
        </div>
      </header>

      <p className="mb-4 text-base leading-7">{answer.headline}</p>

      <dl className="border-t pt-3">
        <Row label="Control mode">
          <span className="font-medium">{answer.controlMode}</span>
          <span className="ml-1 text-muted-foreground">— {answer.controlModePlain}</span>
        </Row>
        <Row label="Evidence basis">{answer.evidenceBasisLabel}</Row>
        <Row label="Evidence">
          {answer.evidenceRef ?? "No evidence reference recorded"}{" "}
          {answer.verifiedAt ? (
            <span className="text-muted-foreground">
              · verified {answer.verifiedAt}
            </span>
          ) : (
            <span className="text-muted-foreground">· verification date unknown</span>
          )}
        </Row>
        <Row label="Markets">
          {answer.markets.length > 0 ? (
            answer.markets.join(", ")
          ) : (
            <span className="text-muted-foreground">Not stated — treat as unknown</span>
          )}
        </Row>
        {groups.length > 0 ? (
          <Row label="Conditions">
            <ul className="space-y-1.5">
              {groups.map((group) => (
                <li key={group.kind}>
                  <span className="font-medium">{group.label}:</span>{" "}
                  {group.items.map((item) => item.detail).join("; ")}
                </li>
              ))}
            </ul>
          </Row>
        ) : null}
        {answer.prerequisites.length > 0 ? (
          <Row label="Prerequisites">{answer.prerequisites.join("; ")}</Row>
        ) : null}
        {answer.exclusions.length > 0 ? (
          <Row label="Exclusions">{answer.exclusions.join("; ")}</Row>
        ) : null}
        {answer.unresolved.length > 0 ? (
          <Row label="Unresolved">
            <ul className="list-disc space-y-1 pl-4 text-amber-700 dark:text-amber-400">
              {answer.unresolved.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Row>
        ) : null}
      </dl>
    </article>
  )
}
