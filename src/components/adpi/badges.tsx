import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AvailabilityOutcome, EvidenceBasis } from "@/lib/adpi/types"

const OUTCOME_STYLE: Record<AvailabilityOutcome, string> = {
  supported: "border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  conditional: "border-amber-600/40 bg-amber-600/10 text-amber-700 dark:text-amber-400",
  unknown: "border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-400",
}

const OUTCOME_LABEL: Record<AvailabilityOutcome, string> = {
  supported: "Supported",
  conditional: "Conditional",
  unknown: "Unknown",
}

const BASIS_STYLE: Record<EvidenceBasis, string> = {
  account_observed: "border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  documented: "border-blue-600/40 bg-blue-600/10 text-blue-700 dark:text-blue-400",
  vendor_announced: "border-violet-600/40 bg-violet-600/10 text-violet-700 dark:text-violet-400",
  unknown: "border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-400",
}

const BASIS_LABEL: Record<EvidenceBasis, string> = {
  account_observed: "Account-observed",
  documented: "Documented",
  vendor_announced: "Announced",
  unknown: "Unknown basis",
}

const CONTROL_STYLE: Record<string, string> = {
  control: "border-foreground/30 bg-foreground/5",
  signal: "border-amber-600/40 bg-amber-600/10 text-amber-700 dark:text-amber-400",
  automatic: "border-rose-600/40 bg-rose-600/10 text-rose-700 dark:text-rose-400",
  recommendation: "border-sky-600/40 bg-sky-600/10 text-sky-700 dark:text-sky-400",
  reporting_only: "border-slate-500/40 bg-slate-500/10",
  not_applicable: "border-slate-500/40 bg-slate-500/10",
}

const CONTROL_LABEL: Record<string, string> = {
  control: "Control",
  signal: "Signal",
  automatic: "Automatic",
  recommendation: "Recommendation",
  reporting_only: "Reporting only",
  not_applicable: "N/A",
}

export function OutcomeBadge({ outcome }: { outcome: AvailabilityOutcome }) {
  return <Badge variant="outline" className={cn(OUTCOME_STYLE[outcome])}>{OUTCOME_LABEL[outcome]}</Badge>
}

export function BasisBadge({ basis }: { basis: EvidenceBasis }) {
  return <Badge variant="outline" className={cn(BASIS_STYLE[basis])}>{BASIS_LABEL[basis]}</Badge>
}

export function ControlBadge({ mode }: { mode: string }) {
  return (
    <Badge variant="outline" className={cn(CONTROL_STYLE[mode] ?? "")}>
      {CONTROL_LABEL[mode] ?? mode}
    </Badge>
  )
}
