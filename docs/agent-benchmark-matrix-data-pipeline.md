# Agent Benchmark Matrix data pipeline

Reference for how `/solutions/agent-benchmark-matrix` gets its data and why it is
built this way. It deliberately mirrors the Pareto Frontier pipeline
([`pareto-frontier-data-pipeline.md`](./pareto-frontier-data-pipeline.md)) because
the delivery problems are identical: keep the data fresh without redeploying the
site, without metered object storage, and without letting a bad refresh blank the
page.

## Shape

```
GitHub Actions (.github/workflows/refresh-agent-benchmarks.yml)
  cron: 42 6 * * *            ->  refresh daily, plus manual dispatch
        |
        +- pnpm agent-benchmarks:seed     (scripts/build-agent-benchmark-seed.ts)
        |    +- reads the curated registries in src/data/agent-benchmarks/*.json
        |    +- validation gates (validation.ts): known ids, finite in-range
        |    |   scores, provenance present, no duplicate identity, no
        |    |   accidental corpus collapse
        |    +- writes src/data/agent-benchmarks/results.json (compact)
        |
        +- pnpm exec tsx scripts/publish-agent-benchmark-data.ts
             +- upserts agent-benchmark-snapshot.json on the `benchmark-data`
                branch (GitHub Contents API; branch created from main's tip on
                first run). Refuses to publish if the corpus shrinks > 50%.

Runtime  (src/lib/agent-benchmarks/registry.ts)
  1. durable  : raw.githubusercontent.com/<repo>/benchmark-data/agent-benchmark-snapshot.json
  2. bundled  : seed registries + results.json, composed in registry.ts  (last-known-good)
```

| Layer | Path | Updated | Purpose |
|---|---|---|---|
| **Durable** | `benchmark-data` branch, `agent-benchmark-snapshot.json` | every refresh | live data the site reads |
| **Bundled** | the seed registries + `results.json` on `main`, composed at runtime | on meaningful change | guaranteed render path + test fixture |

## Why the seed is curated, not scraped (for now)

Benchmark results are **not** like model prices. A price API returns a number;
a benchmark result is
`benchmark + version + subset + metric + model revision + harness + protocol + effort -> score`.
Most relevant sources do not publish a stable machine-readable result file, and
several (AutomationBench, GDPval, Agents' Last Exam) have multiple incompatible
protocols under one display name. Auto-scraping those pages would produce
exactly the false comparability this page exists to prevent.

So v1 ships a **curated, source-traced registry**:

- every row cites an exact source URL and a provenance class
  (`benchmark_repo`, `benchmark_paper`, `vendor_official`,
  `independent_reproduction`);
- a number quoted from a competitor's comparison table is marked
  `evidenceQuality: "low"` and says so in its note;
- rows whose subset/protocol differs from another row carry an explicit
  `subset`, so they can never be ranked together.

Automated adapters are the next step (see *Not yet covered*).

## View design (why the default is dense, not complete)

The registry is deliberately broader than the default view. A benchmark result
is only comparable when benchmark, version, subset, metric, protocol and effort
line up, and much of the public record simply does not cover current models —
AutoBench, GDPval and Agents' Last Exam each ship several incompatible protocols,
and seven tracked benchmarks currently have no current-model result at all.

So the page has two views:

| View | What it shows | Why |
|---|---|---|
| **Compare** (default) | Benchmarks with ≥ 3 cohort models and models with ≥ 2 results in that set | A dense, decision-useful comparison |
| **Coverage** | Every model × every tracked benchmark, every gap | Sparsity is the information |

Both thresholds come from the data (`MIN_MODELS_PER_BENCHMARK`,
`MIN_BENCHMARKS_PER_MODEL` in `aggregate.ts`), so benchmarks graduate into the
default comparison on their own as ingestion improves — no UI edit required.
Nothing is deleted: benchmarks below the threshold appear under *Tracked,
awaiting current results*, and are clickable.

The dense view shows one metric per benchmark: whichever declared metric carries
the most comparable coverage for the selected cohort (`selectCompareMetricId`).
OSWorld 2.0, for example, shows its partial-progress metric rather than binary
completion, because that is where the current-model evidence actually is. The
coverage map shows every declared metric.

Missing cells are never filled. `missingReason()` distinguishes *no public
result*, *tracked but not ingested*, *incompatible protocol* and *filtered out*,
and the reason is available on the cell.

## Adding data

1. **A benchmark.** Add an entry to `src/data/agent-benchmarks/benchmarks.json`
   (`tier`, `comparePriority`, `category`, `axes`, `primaryMetricIds`, source
   URLs, audit fields) and a matching entry to `candidates.json`.
   `comparePriority` is the curated column order for the default comparison; set
   it to `null` to fall back to coverage-descending, then name.
2. **A model or alias.** Add to `models.json`. Aliases must be exact strings a
   source actually prints; matching is exact and case-insensitive only. A new
   family member never inherits another member's scores. Set `tracked: true`
   only for the current-generation models that belong in the default cohort.
3. **A harness.** Add to `harnesses.json` if it is not already there.
4. **A result.** Add a row to the `ROWS` table in
   `scripts/build-agent-benchmark-seed.ts`, then run
   `pnpm agent-benchmarks:seed` and commit the regenerated
   `results.json`.

## Operating it

```bash
pnpm exec tsx scripts/build-agent-benchmark-seed.ts   # rebuild + validate
GITHUB_TOKEN=... pnpm exec tsx scripts/publish-agent-benchmark-data.ts   # publish
```

| Where | Name | Purpose |
|---|---|---|
| Actions default token | `GITHUB_TOKEN` (`contents: write`) | create/update the `benchmark-data` branch |
| Vercel env (optional) | `AGENT_BENCHMARK_SNAPSHOT_URL` | override the durable snapshot URL |

`BENCHMARK_SNAPSHOT_SCHEMA_VERSION` in `registry.ts` is appended to the snapshot
URL as `?v=N`. Bump it whenever the snapshot shape changes: the read is cached
for an hour, so without the bump a schema change could be served the previous
shape until the cache expired. `isPlausibleSnapshot()` also rejects a snapshot
whose models or benchmarks predate the current fields, falling back to the
bundled seed rather than rendering a wrong view.

## Deliberate limits

- **Never-shrink**: the publisher refuses to write a snapshot with < 50% of the
  previous reported-result count.
- **A failed refresh never blanks the page**: the runtime falls back to the
  bundled seed on any durable-read failure.
- **Comparability is enforced in code**, not by convention: `comparisonGroupId`
  is the only key allowed to rank results together, and it includes benchmark,
  version, subset, metric, observation mode, tool mode and reasoning effort.
- **No composite score**: percentages across benchmarks are never averaged.

## Not yet covered

- Automated adapters for sources that *do* publish machine-readable results
  (AppWorld `_leaderboard.json`, tau3 `submission.json`, TheAgentCompany
  experiments, GAIA `results_public`, Hugging Face benchmark leaderboard API).
  The `sources.json` registry marks these `pending`.
- Per-source freshness is reported, but the daily workflow currently republishes
  the reviewed seed rather than fetching upstream. Until adapters land, a source
  marked `pending` means "identified, not fetched".
- Task-level OSWorld 2.0 artefacts are not available, so no derived
  "audit-clean" score is computed; only the audit caveat is surfaced.
- The compare thresholds (3 models / 2 results) are fixed constants. They are
  exported and unit-tested, but not yet configurable per benchmark.
- "Frontier comparison" includes Anthropic, Google and Meta as baselines; this
  is a hard-coded organisation list in `cohort.ts` rather than registry data.
