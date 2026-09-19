/**
 * The reviewed launch questions (#57 / #61 Stage 1).
 *
 * These are the three planner questions the public launch slice is reviewed
 * against. Each names the source the answer must come from and the concepts the
 * question deliberately separates (for example hard control vs an optimisation
 * signal). The explorer uses them for the guided workflow and as the shipped
 * worked examples.
 */
import type { PlannerQuery } from "./types";

export interface LaunchQuestion {
  id: string;
  /** The vendor surface the question is about. */
  vendor?: string;
  label: string;
  query: PlannerQuery;
  /** The distinction a planner must not have flattened. */
  distinction: string;
  /**
   * The reviewed golden case ids that answer this question. Some questions need
   * more than one capability to be answered honestly (for example Pinterest
   * keyword match types AND the automated optimisation they may not control).
   */
  caseIds: string[];
}

export const LAUNCH_QUESTIONS: LaunchQuestion[] = [
  {
    id: "pmax-audience-signals",
    vendor: "Google Ads",
    label: "Performance Max audience signals — hard control or optimisation signal?",
    caseIds: ["pmax-audience-signals"],
    query: {
      text: "audience signals performance max",
      vendor: "Google Ads",
      platform: "Performance Max",
    },
    distinction:
      "An audience signal guides optimisation; it is not a hard audience restriction. Control and signal are different meanings.",
  },
  {
    id: "tiktok-search-campaign",
    vendor: "TikTok",
    label: "TikTok Search Ads Campaign vs the automatic search placement",
    caseIds: ["tiktok-search-campaign", "tiktok-auto-search-placement"],
    query: {
      text: "search ads campaign automatic search placement",
      vendor: "TikTok",
    },
    distinction:
      "A Search Ads Campaign is advertiser-set; the automatic search placement is chosen by the platform. Advertiser control differs.",
  },
  {
    id: "pinterest-keyword-match",
    vendor: "Pinterest",
    label: "Pinterest keyword match controls vs optimisation behaviour",
    caseIds: ["pinterest-keyword-match-types", "pinterest-automated-optimisation"],
    query: {
      text: "keyword match type control optimisation",
      vendor: "Pinterest",
    },
    distinction:
      "Choosing a match type is a control; the platform's automated optimisation can still adjust delivery. Neither overrides the other's meaning.",
  },
];

/**
 * A deliberately unanswerable variant used to prove abstention: a platform that
 * is not in the corpus. The answer must be `unknown` with an explicit
 * abstention, never a guess.
 */
export const ABSTENTION_QUESTION: LaunchQuestion = {
  id: "unresolved-nonexistent",
  label: "A deliberately unresolved question (abstention proof)",
  query: {
    text: "guaranteed reach forecasting for a platform that does not exist zzqx",
    vendor: "NoSuchVendor Inc.",
    platform: "Imaginary Ads",
  },
  distinction: "Nothing in the dataset evidences this; the correct answer is an explicit abstention.",
  caseIds: [],
};
