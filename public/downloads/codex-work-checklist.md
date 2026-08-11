# The Codex Work Checklist — a practical template

> Companion download for **"What 551 Codex Sessions Reveal About Real AI Work"**.
> Copy-paste these templates. Keep them small: the point is a *bounded, recoverable,
> measurable* loop, not a heavier process.

## 1 · Task-packet template (send this, nothing more)

- Task ID: `____________`
- Objective (one deliverable sentence): `____________`
- Allowed paths: `____________`  (e.g. `app/`, `content/posts/`)
- Boundaries (do NOT touch): `____________`
- Done condition: `____________`  (e.g. "tests pass, changed files listed")
- Evidence path for the result: `____________`
- Tool budget (optional): `____________`  (e.g. 8 substantive calls)
- Reference paths/excerpts to load: `____________`

> Rule: write it as if a stranger completes it with no memory of your conversation.
> Every fuzzy line you delete is context you stop shipping at every compaction.

## 2 · Metadata-only indexing checklist

- [ ] Script that stream-parses transcripts (never dump a whole file).
- [ ] Extract only metadata: tool-call counts, token aggregates, compactions, model/role.
- [ ] Exclude prompts, tool outputs, and user content by design.
- [ ] Define your clean scope up front (top-level sessions, date range, exclusions).
- [ ] Point at a session folder and emit aggregates.

## 3 · Recoverable-autonomy checklist

- [ ] Checkpoint durable state, not just the answer (task ID, step, what is proven).
- [ ] Lease any persistent/shared controller (browser endpoint, model relay); one owner.
- [ ] Release the lease only after a health check.
- [ ] Treat a timeout as a question: confirm no activity across two checks first.
- [ ] Name the owner of the next action before stopping.

## 4 · Honest token reporting (do not overclaim)

- [ ] Separate **measured** values from **estimates/proxies**.
- [ ] Note provider-side billing is often *not* in your local logs.
- [ ] Never state an exact token-savings percentage unless you have the counterfactual.
- [ ] Record that counts show **activity**, not time, value, or success.

## 5 · Six human-centred principles

1. Measure, then improve.
2. The packet is the product.
3. Scope the context, not the code.
4. Checkpoint the state, not the answer.
5. Lease what must not be shared.
6. Name the owner of the next action.
