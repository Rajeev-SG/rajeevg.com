/** Plain-English labels and colour classes, so the UI never invents wording. */
import type { Availability, ControlMode, EvidenceBasis, Maturity } from "./types";

export const CONTROL_MODE_LABEL: Record<ControlMode, string> = {
  control: "Hard control (you set it)",
  signal: "Optimisation signal (guides it)",
  recommendation: "Recommendation (you accept it)",
  automatic: "Automatic (platform decides)",
  reporting_only: "Reporting only (no delivery effect)",
  not_applicable: "Not applicable",
};

export const CONTROL_MODE_CLASS: Record<ControlMode, string> = {
  control: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  signal: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  recommendation: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  automatic: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  reporting_only: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  not_applicable: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
};

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  supported: "Supported",
  conditional: "Conditional",
  unknown: "Unknown",
};

export const AVAILABILITY_CLASS: Record<Availability, string> = {
  supported: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  conditional: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  unknown: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
};

export const EVIDENCE_BASIS_LABEL: Record<EvidenceBasis, string> = {
  documented: "Documented",
  account_observed: "Account-observed",
  vendor_announced: "Vendor-announced",
  unknown: "No stated basis",
};

export const MATURITY_LABEL: Record<Maturity, string> = {
  live: "Live",
  beta: "Beta",
  pilot: "Pilot",
  allowlist: "Allowlist",
  deprecated: "Deprecated",
  migrating: "Migrating",
  unknown: "Unknown",
};

export const CONDITION_KIND_LABEL: Record<string, string> = {
  allowlist: "Allowlist",
  beta: "Beta",
  eligibility: "Eligibility",
  prerequisite: "Prerequisite",
  market: "Market",
  spend: "Spend",
  other: "Other",
  objective: "Objective",
};
