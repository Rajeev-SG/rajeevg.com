# Programmatic SEO Proposal — rajeevg.com (2026-09-05)

Bounded pSEO proposal grounded in first-party Search Console + GA4 data pulled live on 2026-09-05, plus current external search evidence. Complements the conceptual framework in [ppSEO.md](ppSEO.md).

## Evidence date and methodology

- **Pull date:** 2026-09-05, via Search Console API (`searchanalytics.query`) and GA4 Data API (`runReport`) using the existing `personal-gws-1` service account with read-only scopes.
- **GSC coverage:** property `sc-domain:rajeevg.com`, full retained window 3 Aug 2025 → 4 Sep 2026 (397 daily rows).
- **GA4 coverage:** property `498363924`, 90-day window 7 Jun 2026 → 5 Sep 2026, `hostName = rajeevg.com`/`www.rajeevg.com`.
- **Windows compared:** recent 90 days (7 Jun → 4 Sep) vs preceding 90 days (9 Mar → 6 Jun).
- **External evidence:** Ahrefs keyword data as cited in a June 2026 practitioner guide (mbadv.agency), 2026 sGTM adoption data (technologychecker.io, 35× growth in 13 months to 17k+ domains), and Bounteous/Pandectes 2026 server-side analytics trend pieces. All checked 2026-09-05.
- **Privacy:** raw query strings were pulled locally only (`.gsc-research/`, git-excluded); this report carries aggregates and editorially safe themes.

## Baseline metrics

| Metric | Recent 90d | Prior 90d | Direction |
|---|---|---|---|
| GSC clicks (page-dim) | 35 | 0 | ↑ sharp |
| GSC impressions (page-dim) | 1,001 | 252 | ↑ ~4× |
| GA4 organic sessions (all hosts) | 14 | — | small |
| Indexed pages | 11 | — | — |
| Known pages / submitted sitemap | 18 / 22 | — | — |

**Quarterly impressions trend:** 2025-Q3 19 → Q4 130 → 2026-Q1 298 → Q2 277 → **Q3 872 (35 clicks)**. Organic search is compounding from a very low base, concentrated in the last quarter.

**Channel context (GA4, 90d):** Direct 98, Organic Social 78, **Organic Search 14**, Referral 10 sessions. Organic is the smallest measured channel — every click matters at this scale.

**Canonical-host inconsistency:** organic sessions split evenly `rajeevg.com` (7) vs `www.rajeevg.com` (7). Normalize before scaling content.

## Ranked opportunity clusters

### 1. "When NOT to use server-side tagging" — fix before scaling (update existing, priority 1)

- **Evidence:** `/blog/when-not-to-use-server-side-tagging` earned **127 impressions, 0 clicks, avg position 63.9** (page 7+) over 90d — impressions exist but the page never surfaces. External data confirms demand: "server side tagging" carries ~500 US monthly searches at KD 33, with "what is server side tagging" at KD 1 ([mbadv.agency, June 2026](https://www.mbadv.agency/google-tag-manager/server-side-tagging)).
- **Recommendation:** **update existing article** — retitle toward the balanced decision angle ("Server-side tagging: when it's worth it and when it isn't"), add an explicit pros/cons/decision matrix, and strengthen internal links from `/blog/why-i-built-an-llm-pareto-frontier`-style solution pages. This is a cannibalization/positioning problem, not a demand problem.
- **Uniqueness payload:** the author's own production sGTM migration evidence (gtm-site-speed.rajeevg.com subdomain), real cost figures, and the "when not to" counter-position that generic guides avoid.
- **Internal links:** parent `/solutions` hub; sibling `/blog/why-i-built-an-llm-pareto-frontier`.
- **Index decision:** index (already indexed; needs ranking work, not gating).
- **Maintenance:** quarterly position check.
- **Confidence:** high (first-party impressions + external keyword data align).

### 2. Codex subagents / multi-agent cost control — expand the proven winner (pattern page, priority 2)

- **Evidence:** `/blog/how-i-ran-qwen-locally-inside-codex` — **25 clicks / 449 imp / pos 7.4 / CTR 5.6%**; `/blog/i-made-glm-5-3-flash-faster-but-kept-cheap-routing` — **7 clicks / 123 imp / pos 6.0**. Theme aggregate: "ai agents/codex" 7 queries, pos ~19. External: Codex subagents reached GA mid-March 2026; GLM 5.3 pricing/agent-economics is an active 2026 discussion ([digitalapplied.com](https://www.digitalapplied.com/blog/codex-subagents-ga-multi-agent-autonomous-coding-guide), [wavespeed.ai](https://wavespeed.ai/blog/ai-api-pricing/glm-5-3-pricing/)).
- **Recommendation:** **bounded pattern page** — `/playbooks/codex-subagent-cost-control` as a decision-oriented playbook consolidating the three existing posts into one canonical hub with per-scenario recommendations. Template: problem → decision matrix → measured results → pitfalls.
- **Uniqueness payload:** real measured token costs and quota-guard code from the author's own rig (gh-88/90/92 series), not vendor marketing.
- **Internal links:** parent `/solutions`; children = the three existing posts (which keep their URLs and gain a parent hub).
- **Index decision:** index (single page, genuine consolidation value — not thin scale).
- **Maintenance:** re-verify model pricing quarterly; update or prune if numbers drift.
- **Confidence:** medium-high (proven CTR, established positions, but small absolute volume).

### 3. "From AI pilots to business value" — reposition for high-impression query (update existing, priority 3)

- **Evidence:** `/blog/from-ai-pilots-to-business-value` — **168 impressions, 0 clicks, pos 12.1**. Page sits at the bottom of page 2 for a definitional query; a title/meta rewrite targeting the actual query intent could move it to page 1.
- **Recommendation:** **update existing article** — sharpen title/meta to match the observed query intent, add a direct answer block in the first 100 words.
- **Uniqueness payload:** the author's own pilot-to-production narrative already on the page.
- **Internal links:** parent `/ai` hub.
- **Index decision:** index.
- **Maintenance:** monthly position check for 8 weeks; revert if CTR doesn't move.
- **Confidence:** medium (position near page 2 boundary; intent match needs validation in SERP).

### 4. Rejected ideas

- **"Server-side tagging dezavantaje" (Romanian):** 15 impressions, non-English market, no matching content, and the site has no Romanian-language authority. **Reject** — wrong audience, thin payoff.
- **A `/glossary/*` programmatic expansion:** the content-ops workbook lists glossary nodes, but current GSC data shows no glossary queries earning impressions. **Reject for now** — no first-party demand signal; revisit after clusters 1–3 prove out.
- **Model/vendor news pages (GLM benchmark coverage):** external evidence shows active interest, but this is short-lived vendor-news demand, not durable workflow demand. **Reject** as pSEO; cover opportunistically in existing articles instead.
- **Large-scale template pages (>20 URLs):** the site has 18 known pages total; scaled content would violate the quality bar in ppSEO.md and Google's scaled-content policy. **Reject** categorically at current site scale.

## First 3-page pilot

1. **Rewrite + reposition** `/blog/when-not-to-use-server-side-tagging` (cluster 1).
2. **Publish** `/playbooks/codex-subagent-cost-control` (cluster 2).
3. **Rewrite title/meta + answer block** `/blog/from-ai-pilots-to-business-value` (cluster 3).

## Next 6 pages — only if the pilot earns it

Scale only if the pilot shows, after 8 weeks, that at least 2 of 3 pages moved ≥5 positions or gained ≥20 impressions/quarter. Candidates then: "GTM server-side cost calculator" pattern page, "OpenRouter-backed AI team" hub refresh, "Two-agent personal cloud" update, and one more decision-matrix playbook. Do not pre-commit beyond that — the site's authority is too small to absorb speculative scale.

## Measurement / kill criteria (8–12 weeks)

- **Week 4 checkpoint:** positions for the three pilot pages; impressions trend.
- **Week 8 decision:** ≥2 of 3 pages moved ≥5 positions or gained ≥20 impressions → proceed to next 3 pages. Otherwise stop, analyze, and fix before adding anything.
- **Kill criteria per page:** after 12 weeks, if a page has 0 clicks and no position improvement → merge its substance into a better-performing sibling and redirect, per ppSEO.md's prune-or-consolidate rule.
- **Watch:** "Crawled – currently not indexed" count (currently 2) must not grow as new pages ship.
- **Instrumentation:** quarterly GSC pull using the same API path; store aggregates in the content-ops dashboard (GSC metrics are now wired into `/dashboard` via the merged gh-103 integration).

## Pilot implementation record (2026-09-05)

- Item A (SST rewrite): retitled "Server-Side Tagging: When It's Worth It and When It Isn't"; answer-first short answer; cost autopsy retained as evidence; internal links to agentic-data-collection and consent-stack articles.
- Item B (playbook): published `/blog/codex-subagent-cost-control` — decision matrix, measured/estimate/recommendation separation, links to the three source posts.
- Item C (AI pilots): answer-first short answer added; internal links to the multi-agent journey, projects-behind-this-portfolio, and /solutions.
- Baseline (from the 90-day GSC window ending 2026-09-04): SST page 127 imp / 0 clicks / pos 63.9; from-ai-pilots 168 imp / 0 clicks / pos 12.1; qwen post 449 imp / 25 clicks / pos 7.4; GLM post 123 imp / 7 clicks / pos 6.0.
- Evaluation: weeks 4 and 8 checkpoints on position/impressions for the three pilot URLs, tracked through the dashboard Analytics view; kill criteria per the section above.

## Prerequisites flagged

- Normalize `www.rajeevg.com` → apex before publishing new URLs (currently ~15% of organic sessions split across hosts).
- All new pSEO pages must land in `sitemap.xml` and carry the site's existing structured data.
