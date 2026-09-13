/**
 * Model cohorts for the Agent Benchmark Matrix.
 *
 * A cohort is a *view filter*: it never removes a model from the registry, and
 * "All models" is always one click away. Membership of "My models" comes from
 * the explicit `tracked` flag in the model registry, so it stays a deliberate
 * editorial choice rather than a name-matching guess.
 */
import type { ModelRecord } from "./types";

export type Cohort = "my_models" | "frontier" | "all";

/** Organisations treated as frontier baselines alongside the tracked set. */
const FRONTIER_ORGANISATIONS = ["Anthropic", "Google", "Meta"];

export const COHORT_OPTIONS: { value: Cohort; label: string; hint: string }[] = [
  { value: "my_models", label: "My models", hint: "The current-generation families used for day-to-day model selection." },
  { value: "frontier", label: "Frontier comparison", hint: "The tracked families plus Claude, Gemini and other frontier baselines." },
  { value: "all", label: "All models", hint: "Every model in the registry." },
];

export function inCohort(model: Pick<ModelRecord, "organisation" | "tracked">, cohort: Cohort): boolean {
  switch (cohort) {
    case "my_models":
      return model.tracked;
    case "frontier":
      return model.tracked || FRONTIER_ORGANISATIONS.includes(model.organisation);
    case "all":
      return true;
  }
}
