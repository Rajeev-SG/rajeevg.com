import { ARCHIVED_HACKATHON_VOTE_TRUTH } from "@/lib/hackathon-vote-truth-archive"

const trackedEntries = [
  { slug: "what-s-my-frog", submissions: 21, averageScore: 7.43 },
  { slug: "audience-insights-generator", submissions: 19, averageScore: 6.32 },
  { slug: "brief-it", submissions: 19, averageScore: 5.47 },
  { slug: "planet-killer", submissions: 19, averageScore: 6.74 },
  { slug: "taxo-guard", submissions: 18, averageScore: 6.22 },
  { slug: "trafficker-on-steriods", submissions: 18, averageScore: 6.44 },
  { slug: "modellens", submissions: 17, averageScore: 6.63 },
  { slug: "planet-assisstant", submissions: 17, averageScore: 6.65 },
  { slug: "autopull-aliance", submissions: 15, averageScore: 6.2 },
]

export const hackathonEventDayReport = {
  date: "2026-03-25",
  dateLabel: "25 March 2026",
  officialVotes: ARCHIVED_HACKATHON_VOTE_TRUTH.totals.totalVotes,
  trackedSubmissions: 172,
  coverage: 58,
  judges: ARCHIVED_HACKATHON_VOTE_TRUTH.totals.uniqueJudges,
  trackedOverview: {
    events: 4936,
    users: 35,
    pageViews: 191,
  },
  consent: {
    denied: 181,
    granted: 44,
  },
  events: [
    { name: "competition_state_snapshot", count: 2322 },
    { name: "scroll_depth", count: 534 },
    { name: "vote_dialog_viewed", count: 342 },
    { name: "vote_score_selected", count: 339 },
    { name: "page_context", count: 225 },
    { name: "page_view", count: 191 },
    { name: "vote_submit_started", count: 172 },
    { name: "vote_submitted", count: 172 },
  ],
  entries: ARCHIVED_HACKATHON_VOTE_TRUTH.entries.map((entry) => {
    const tracked = trackedEntries.find((item) => item.slug === entry.slug)
    return {
      slug: entry.slug,
      projectName: entry.projectName,
      officialVotes: entry.voteCount,
      officialAverageScore: entry.averageScore ?? 0,
      trackedSubmissions: tracked?.submissions ?? 0,
      trackedAverageScore: tracked?.averageScore ?? 0,
    }
  }),
} as const
