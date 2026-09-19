"use client"

import { useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import { QualifiedAnswerCard } from "./qualified-answer"
import { compare, qualify } from "@/lib/adpi/qualify"
import type { Capability, PlannerQuestion } from "@/lib/adpi/types"

interface PlannerProps {
  capabilities: Capability[]
  questions: PlannerQuestion[]
}

/**
 * The qualified planner workflow (#57): answer a planner question with a
 * dated, qualified answer or an explicit unresolved state, and compare two
 * capabilities without implying they are equivalent.
 */
export function Planner({ capabilities, questions }: PlannerProps) {
  const [activeQuestion, setActiveQuestion] = useState<string>(questions[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [leftId, setLeftId] = useState<string>("")
  const [rightId, setRightId] = useState<string>("")

  const byId = useMemo(() => new Map(capabilities.map((c) => [c.id, c])), [capabilities])

  const matches = useMemo(() => {
    const question = questions.find((q) => q.id === activeQuestion)
    if (question) {
      // Deterministic, exact join: each reviewed record declares the question
      // ids it answers (the same `question_ids` the golden slice emits), so a
      // broken link yields an empty set and an explicit unresolved state
      // rather than silently substituting unrelated capabilities.
      return capabilities.filter((c) => c.question_ids?.includes(question.id))
    }
    const needle = query.trim().toLowerCase()
    if (!needle) return capabilities.slice(0, 6)
    return capabilities
      .filter((c) =>
        [c.name, c.vendor, c.platform, c.vendor_term ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 12)
  }, [activeQuestion, capabilities, questions, query])

  // A deliberate unresolved state is shown ONLY when the user's own search
  // returns nothing. It must never appear alongside question-driven answers
  // (that was the review's contradictory-state bug), so it is gated on a
  // non-empty query and an empty match set.
  const unresolvedSearch = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return null
    const matched = capabilities.some((c) =>
      [c.name, c.vendor, c.platform, c.vendor_term ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
    return matched ? null : needle
  }, [capabilities, query])

  return (
    <div className="space-y-10">
      <section className="space-y-4" data-analytics-section="adpi_planner">
        <header className="max-w-3xl space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Ask a planning question</h2>
          <p className="text-muted-foreground">
            Answers are qualified: whether it is available to you, what type of control it is,
            what the evidence basis is, and when it was verified. Documentation alone never
            produces an unqualified “yes”.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {questions.map((question) => (
            <button
              key={question.id}
              type="button"
              onClick={() => {
                setActiveQuestion(question.id)
                setQuery("")
              }}
              className={`rounded-full border px-3 py-1.5 text-left text-sm transition-colors ${
                activeQuestion === question.id
                  ? "border-foreground bg-foreground text-background"
                  : "hover:bg-muted"
              }`}
            >
              {question.text}
            </button>
          ))}
        </div>

        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveQuestion("")
          }}
          placeholder="Or search any capability across the dataset…"
          aria-label="Search capabilities for a qualified answer"
          className="max-w-xl"
        />

        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((capability) => (
            <QualifiedAnswerCard key={capability.id} answer={qualify(capability)} />
          ))}
        </div>

        {activeQuestion && matches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-600/50 p-5" data-analytics-item-type="question_unresolved">
            <p className="font-medium">No reviewed records for this question</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The selected question has no matching capability records in the published dataset.
              This is a data-contract failure surfaced explicitly, not hidden behind a fallback.
            </p>
          </div>
        ) : null}
        {unresolvedSearch ? (
          <div className="rounded-xl border border-dashed p-5" data-analytics-item-type="unresolved_state">
            <p className="font-medium">Unresolved — no evidenced answer</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No capability in the published dataset matches “{unresolvedSearch}”. This is an
              explicit unresolved state, not a default: the product will not assert availability it
              has no evidence for. A planner should treat this as “not covered yet”.
            </p>
          </div>
        ) : null}
      </section>

      <section className="space-y-4" data-analytics-section="adpi_compare">
        <header className="max-w-3xl space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Compare two capabilities</h2>
          <p className="text-muted-foreground">
            Comparison shows each side in its own vendor’s terms. It never asserts that two
            vendors’ concepts are the same thing.
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-3">
          <CapabilityPicker label="Left" value={leftId} onChange={setLeftId} capabilities={capabilities} />
          <CapabilityPicker label="Right" value={rightId} onChange={setRightId} capabilities={capabilities} />
        </div>
        {byId.has(leftId) && byId.has(rightId) ? (
          <ComparisonView
            left={byId.get(leftId) as Capability}
            right={byId.get(rightId) as Capability}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Pick two capabilities to compare.</p>
        )}
      </section>
    </div>
  )
}

function CapabilityPicker({
  label,
  value,
  onChange,
  capabilities,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  capabilities: Capability[]
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 max-w-xs rounded-md border bg-background px-2 text-sm"
      >
        <option value="">Select…</option>
        {capabilities.map((capability) => (
          <option key={capability.id} value={capability.id}>
            {capability.vendor} — {capability.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function ComparisonView({ left, right }: { left: Capability; right: Capability }) {
  const result = compare(left, right)
  return (
    <div className="space-y-4">
      {result.caveats.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-amber-600/40 bg-amber-600/5 p-3 text-sm text-amber-800 dark:text-amber-400">
          {result.caveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <QualifiedAnswerCard answer={result.left} />
        <QualifiedAnswerCard answer={result.right} />
      </div>
    </div>
  )
}
