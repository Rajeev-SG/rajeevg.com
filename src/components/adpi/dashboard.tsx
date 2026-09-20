"use client"

import * as React from "react"

import { CapabilityTable } from "./capability-table"
import { QualifiedAnswerCard } from "./qualified-answer"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LAUNCH_QUESTIONS, ABSTENTION_QUESTION } from "@/lib/adpi/launch"
import { answerFromLiveCorpus, answerQuery, compareCapabilities } from "@/lib/adpi/qualified"
import { reviewedGolden } from "@/lib/adpi/reviewed"
import type { CapabilityRecord, PlannerQuery, QualifiedAnswer } from "@/lib/adpi/types"
import { AVAILABILITY_CLASS, AVAILABILITY_LABEL } from "@/lib/adpi/labels"
import { Badge } from "@/components/ui/badge"

/**
 * Launch answers are built from the LIVE published corpus (#163). The reviewed
 * fixture supplies the question framing and the distinction, never the qualified
 * fields and never a synthetic record. A concept with no live qualified record
 * abstains rather than presenting reviewed provenance as live output.
 */
function answerForLaunchQuestion(
  caseIds: string[],
  query: PlannerQuery,
  records: CapabilityRecord[],
): QualifiedAnswer {
  const cases = caseIds
    .map((caseId) => reviewedGolden().cases.find((entry) => entry.id === caseId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  return answerFromLiveCorpus(cases, query, records)
}

function LaunchQuestionCard({
  label,
  distinction,
  answer,
}: {
  label: string
  distinction: string
  answer: QualifiedAnswer
}) {
  return (
    <article className="rounded-xl border p-4 sm:p-5">
      <h3 className="text-base font-medium">{label}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{distinction}</p>
      <div className="mt-3">
        <QualifiedAnswerCard answer={answer} />
      </div>
    </article>
  )
}

export function AdpiDashboard({ records }: { records: CapabilityRecord[] }) {
  const [question, setQuestion] = React.useState("")
  const [freeAnswer, setFreeAnswer] = React.useState<QualifiedAnswer | null>(null)

  const launchAnswers = React.useMemo(
    () =>
      LAUNCH_QUESTIONS.map((entry) => ({
        entry,
        answer: answerForLaunchQuestion(entry.caseIds, entry.query, records),
      })),
    [records],
  )


  const abstentionAnswer = React.useMemo(
    () => answerQuery(records, ABSTENTION_QUESTION.query),
    [records],
  )

  const onAsk = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      setFreeAnswer(answerQuery(records, { text: question }))
    },
    [question, records],
  )

  return (
    <Tabs defaultValue="planner" className="space-y-6">
      <TabsList>
        <TabsTrigger value="planner">Planner</TabsTrigger>
        <TabsTrigger value="explorer">Explorer</TabsTrigger>
      </TabsList>

      <TabsContent value="planner" className="space-y-6">
        <section aria-label="Reviewed launch answers" className="space-y-4">
          <header className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Reviewed launch questions</h2>
            <p className="text-sm text-muted-foreground">
              Each answer is qualified — supported, conditional or unknown — with its evidence basis,
              reference and verification date. Nothing is flattened to a yes/no.
            </p>
          </header>
          {launchAnswers.map(({ entry, answer }) => (
            <LaunchQuestionCard
              key={entry.id}
              label={entry.label}
              distinction={entry.distinction}
              answer={answer}
            />
          ))}
        </section>

        <section aria-label="Abstention example" className="space-y-3">
          <header className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">When the evidence is insufficient</h2>
            <p className="text-sm text-muted-foreground">
              The explorer abstains rather than guess. This question has no matching capability in
              the dataset.
            </p>
          </header>
          <QualifiedAnswerCard answer={abstentionAnswer} />
        </section>

        <section aria-label="Ask a question" className="space-y-3">
          <header className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Ask your own question</h2>
            <p className="text-sm text-muted-foreground">
              Searches the published dataset. An unmatched question returns an explicit unknown, not
              an inferred answer.
            </p>
          </header>
          <form onSubmit={onAsk} className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="adpi-question">
              Your question
            </label>
            <Input
              id="adpi-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. do Pinterest keyword match types give me exact control?"
              className="h-9 w-full sm:w-96"
              data-testid="adpi-question"
            />
            <button
              type="submit"
              className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Ask
            </button>
          </form>
          {freeAnswer ? <QualifiedAnswerCard answer={freeAnswer} /> : null}
        </section>

        <ComparisonNote records={records} />
      </TabsContent>

      <TabsContent value="explorer" className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Master capability explorer</h2>
          <p className="text-sm text-muted-foreground">
            Browse, search, sort and expand every published capability. Unknown availability is shown
            as unknown, never defaulted to supported.
          </p>
        </header>
        <CapabilityTable records={records} />
      </TabsContent>
    </Tabs>
  )
}

/** Cross-platform comparison that warns when concepts are not equivalent. */
function ComparisonNote({ records }: { records: CapabilityRecord[] }) {
  const [leftId, setLeftId] = React.useState("")
  const [rightId, setRightId] = React.useState("")

  const left = records.find((record) => record.id === leftId)
  const right = records.find((record) => record.id === rightId)
  const comparison = left && right ? compareCapabilities(left, right) : null

  const options = React.useMemo(
    () => records.map((record) => ({ id: record.id, label: `${record.vendor}: ${record.name} — ${record.platform}` })),
    [records],
  )

  return (
    <section aria-label="Compare two capabilities" className="space-y-3">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Compare two capabilities</h2>
        <p className="text-sm text-muted-foreground">
          Comparing across platforms never asserts the concepts are identical.
        </p>
      </header>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="adpi-left">
          First capability
        </label>
        <select
          id="adpi-left"
          value={leftId}
          onChange={(event) => setLeftId(event.target.value)}
          className="h-9 max-w-xs rounded-md border bg-background px-2 text-sm"
        >
          <option value="">Select a capability…</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="adpi-right">
          Second capability
        </label>
        <select
          id="adpi-right"
          value={rightId}
          onChange={(event) => setRightId(event.target.value)}
          className="h-9 max-w-xs rounded-md border bg-background px-2 text-sm"
        >
          <option value="">Select a capability…</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {comparison ? (
        <div className="space-y-2">
          {comparison.caveatRequired ? (
            <p
              data-testid="adpi-comparison-caveat"
              className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
            >
              {comparison.caveat}
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {[comparison.left, comparison.right].map((record) => (
              <div key={record.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{record.name}</p>
                <p className="text-muted-foreground">
                  {record.vendor} · {record.platform}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <Badge variant="outline" className={AVAILABILITY_CLASS[record.availability]}>
                    {AVAILABILITY_LABEL[record.availability]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
