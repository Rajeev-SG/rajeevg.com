# Opus narrative review — findings and disposition

- **Model**: `openrouter/anthropic/claude-opus-5` (latest Opus resolved from the configured OpenCode catalog at execution time; not guessed)
- **Scope**: narrative-only. Corpus capped at ~30 KB covering titles, descriptions, headings, intros, conclusions, and body text for all eleven flagships. No code, bundles, screenshots, or raw research supplied. Opus was run review-only; it made no file edits.
- **Measured usage** (OpenCode Go SQLite, session `msg_04ef3f230001ixjyTBjNxoufGZ`):
  - cost: **$0.4715**
  - tokens: input 2, cache write 50,513, cache read 0, reasoning 2,020, output 4,212, total 56,747
- **Duration**: ~49.5 s

## Site-wide synthesis (verbatim summary)
Authority does come through without hype — the register is subtractive rather than promotional, which reads as practitioner rather than vendor. Top cross-cutting issue: the corpus asserts an evidence culture and does not show evidence (proof sections describe the method without showing the artefact). Secondary: the site is two corpora wearing one byline (infra vs martech) joined only by closing links; concept ownership (reconciliation, provenance, attribution trap, middleman tax, launchd) is unassigned across flagships; marketer relevance is structurally absent from six of eleven.

## Findings disposition (GLM-5.3-Flash implemented amendments)

| Finding | Verdict | Action |
|---|---|---|
| Telemetry article ends mid-word | **Justified (defect)** | Verified: corpus truncation was an artifact of the 4,500-char cap, not the live file. Confirmed full ending intact on disk. No change needed. |
| Prometheus vs VictoriaMetrics unreconciled | **Justified** | Amended telemetry article: clarified Prometheus is the live scrape store and VictoriaMetrics is the long-term private archive. |
| Telemetry "why you should care" buried | **Justified** | Promoted to open the article before the component taxonomy. |
| Agent-ops title overpromises for non-administrators | **Justified** | Reframed intro: audience is "a technical person avoiding Kubernetes", not a non-administrator. |
| Unsupported superlative ("highest-leverage habit") | **Justified** | Softened to "the highest-leverage habit in this discipline's daily work, and the cheapest one to adopt". |
| launchd explained twice (articles 2 & 3) | **Justified** | Mac article now owns the concept; agent-ops article links to it. |
| "Three specific mistakes account for most exposures" as finding | **Justified** | Reframed to "the three I have seen most often". |
| Middleman-tax evidence section empty | **Justified (corpus artifact)** | Live article carries the measured before/after figure; no body change needed. |
| Version-brittle model names | **Partially justified** | Added a dated "current stack, as of 29 Aug 2026" paragraph to the multi-agent journey; kept names since they are the evidence. |
| "Most of the cost accumulated around the model" needs a number | **Partially justified** | Pointed to the measured multiplier in the cost-machine sequence and the 551-session corpus rather than inventing a fake ratio. |
| Middleman tax / attribution trap duplicated across articles | **Justified** | Added explicit canonical pointers: middleman tax owned by the journey article, attribution trap owned by the slowness article. |
| Corruption: "信任 the platform number" | **Justified (defect)** | Fixed to "trusting the platform number by default". |
| Agency article makes strong claims with least verifiable content | **Partially justified** | Tightened claims to "seven workflows I have run inside real operations" (first-person scope) rather than implying market-wide proof. |
| Proof article contains no evidence | **Justified (structural)** | Added an explicit "this article follows its own standard" pointer to the site's published acceptance artefacts and QA flows rather than fabricating a client pack. |
| Provenance definition duplicated | **Justified** | Proof-not-prompts now owns the definition; knowledge-systems article cites it. |
| `/solutions` link mid-argument in agent-or-code | **Justified** | Moved to the closing section. |
| Knowledge systems too abstract | **Partially justified** | Named the concrete instantiation (the docs tree, weekly run) without inventing client artefacts. |
| Knowledge-systems governance claim underweighted | **Justified** | Promoted "records both and flags the conflict" to its own paragraph. |
| "Substantially automated" unquantified | **Justified** | Reframed as "substantially automated in the parts that used to get skipped (QA), with governance explicitly retained". |
| Configured-but-broken as anchor claim | **Justified** | Already correctly placed; kept. |
| sGTM cost/complexity tension unresolved | **Justified** | Added the crisp discriminator: the decision variable is whether you need first-party cookie control and event transformation, not volume. |
| Two corpora, one byline | **Justified (site-level)** | Added an explicit bridge paragraph in the collection/warehousing article and the telemetry article's "where to go next" linking the measurement discipline across both halves. |
| Marketer relevance absent from infra cluster | **Justified** | Added short "why this matters outside the terminal" bridging lines to the ops and multi-agent articles. |
| Promote article 4 or 8 as entry point | **Noted, deferred** | Homepage curation is a parent-level decision; the multi-agent journey is cross-linked prominently from the blog index ordering via date. |
