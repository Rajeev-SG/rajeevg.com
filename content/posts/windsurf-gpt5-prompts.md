---
title: Optimised Prompts for GPT-5 in Windsurf
slug: gpt-windsurf-prompts
date: 2025-08-20
description: A selection of software development prompts optimised for GPT-5 & Windsurf.
tags: [a]
draft: false
---

1. grouped into reusable categories
2. optimized for GPT‑5 in Windsurf (agentic, file‑aware, MCP‑aware)
3. categorised & clean templates with variables you can drop into any repo

I’ve also added a tiny “rules block” you can paste at the top of sessions to keep the agent on rails inside Windsurf, aligned with Windsurf’s own prompt‑engineering guidance and MCP workflows. ([docs.windsurf.com][1], [Windsurf][2])

---

## 1) Global reusable “rules” block (paste at the top of a new session)

```
# windsurf-session-rules
- Follow the plan in @PLAN_FILE until complete; do not deviate unless plan is contradictory or blocks progress.
- Never wait for approval mid‑task; complete and self‑verify before reporting done.
- Use MCP Playwright for verification: browser_take_screenshot, browser_console_messages, navigate, click as needed.
- Run local checks after each change set: `npm run lint`, `npm run build`, `npm run content` and fix all surfaced errors.
- Preserve existing functionality (mdx, theme toggle, syntax highlighting, sidebar, etc.) unless explicitly told to change/remove it.
- Prefer non‑destructive changes; create new files or additive edits where practical.
- Update @README.md (features, structure, instructions) only after successful verification.
```

Why this works in Windsurf:

* It’s brief, action‑oriented, and tells the agent which tools to use (MCP, lint/build), matching Windsurf’s best‑practice guidance to give concrete context and steps. ([docs.windsurf.com][1])
* It explicitly names Playwright MCP tools the agent should call (supported in Windsurf/Cursor MCP ecosystems). ([GitHub][3], [til.simonwillison.net][4])

---

# 2) Categories → Optimized templates

## A) “Resume or switch context”

Use when hopping between tasks or restarting a session.

**Template**

```
You are working inside {REPO_NAME}. Load context from @{README} and @{PLAN}.
Resume the plan at section "{PLAN_SECTION_ID}" and execute now.

Constraints:
- Keep existing features intact: {PRESERVE_FEATURES}.
- Follow @layout.md/@architecture.md as guidance (not strict law); prioritize clean UX and preserved functionality.

Verification:
- Use MCP Playwright to open {APP_URL or DEV_SERVER}, navigate relevant pages, take screenshots, capture console messages.
- Run: npm run lint && npm run build && npm run content. Fix all errors before reporting success.

Deliverables:
- Code changes implementing "{PLAN_SECTION_ID}".
- Updated @README.md (what changed, why, how to use).
```

## B) “Implement a scoped feature”

(Example: blog search + tag filters; progress bar; TOC; etc.)

**Template**

```
Task: Implement {FEATURE_NAME} in the project defined by @{README}.
Authoritative spec: @{SPEC_FILE_OR_SECTION} ("{SPEC_HEADING}").

Requirements:
- Use correct {LIBRARIES/COMPONENTS} per docs and our code patterns.
- Preserve {PRESERVE_FEATURES}.
- Add tests/checks if applicable.

Plan (draft then execute):
1) Read @{SPEC_FILE_OR_SECTION} and relevant components.
2) Produce a short task plan (bullets). Execute immediately.
3) Implement with small, verifiable commits.

Verification:
- Playwright MCP: navigate to {PAGE_PATHS}, take screenshots, capture console logs, assert {UI_EXPECTATIONS}.
- Local checks: npm run lint && npm run build && npm run content. Fix all issues.

Docs:
- Update @README.md with usage, any env vars, and “Project structure” updates.
```

Helpful when components come from shadcn: include the install steps or imports and cite their docs so the agent “knows” where to look. (shadcn and Radix are the canonical sources.) ([Shadcn][5], [Radix UI][6])

## C) “Tiny UX/layout fix”

(Example: spacing, sticky headers, alignment)

**Template**

```
Task: Apply a minimal, targeted fix to {PAGE_OR_COMPONENT}:
- Problem: {SYMPTOM}
- Expected: {EXPECTED_VISUAL_BEHAVIOR}

Rules:
- Minimal diff; do not regress {PRESERVE_FEATURES}.
- Keep layout guidance in @layout.md as soft guidance.

Verify with Playwright MCP:
- Open {PAGE_URL}, capture before/after screenshots at {VIEWPORTS}.
- Confirm no console warnings/errors related to the change.

Run: npm run lint && npm run build. Fix issues.
```

## D) “Content‑only update”

(Example: keep README current)

**Template**

```
Task: Update @README.md to reflect the current project state.

Include:
- Tech stack and libraries (what, why, how used).
- Project structure tree with brief purpose lines.
- Setup & scripts (dev, build, lint, content).
- Feature flags/limitations.
- Recently added features: {FEATURES_LIST}.

Constraints:
- Do not invent features not present in code.
- Keep instructions copy‑pastable and tested.

Verification:
- Run commands in the README steps (dry check where possible).
```

## E) “Integration mapping”

(Example: map Markdown → shadcn components)

**Template**

```
Task: Map Markdown elements to shadcn components as per @{SPEC_FILE} and shadcn docs.

Scope:
- Typography components, code blocks, blockquotes, links, tables, etc.
- Update @hello-world.md to showcase all mapped elements for visual verification.

Steps:
1) Review shadcn component docs for {COMPONENTS}. 
2) Implement MDX renderer overrides mapping → components.
3) Add sample content in @hello-world.md using all mapped elements.

Verification:
- Playwright MCP: open the article page, take full-page screenshot, verify each element renders via shadcn.
- npm run lint && npm run build; fix errors.

Docs:
- Record mapping approach and extension points in @README.md.
```

(shadcn’s component docs: avatar/typography/etc.) ([Shadcn][7])

## F) “Feature regression bugfix (visual interaction)”

(Example: progress bar overlapping sidebar; stickiness at top)

**Template**

```
Task: Fix {FEATURE_NAME} regression.
Current issue: {BUG_DESCRIPTION}.
Expected behavior: {EXPECTED_BEHAVIOR}.

Constraints:
- Progress bar must align with article body and respond to sidebar width.
- Keep behavior consistent at page load and while scrolling.

Implementation hints:
- Use container‑relative widths; recalc on sidebar open/close.
- IntersectionObserver/scroll handler remains source of truth; do not thrash main thread.

Verification (MCP):
- Scenarios: sidebar collapsed/expanded, at top, mid‑scroll, bottom.
- Screenshots for each state; confirm no overlap; console is clean.
- Run lint/build/content; fix issues.
```

## G) “Create new pages with component recipes”

(Example: About & Tools pages using Card/Avatar/Grid)

**Template**

```
Task: Create pages: {PAGE_LIST} and wire them in sidebar.

About page:
- Use shadcn Card + Avatar to build a responsive contact card.
Tools page:
- Responsive grid of Card items; each card is a full-link with image + name.

Steps:
1) Ensure dependencies installed per docs (Card, Avatar).
2) Implement pages and routes.
3) Add simple content placeholders with TODOs.

Verification:
- MCP screenshots at mobile/tablet/desktop widths.
- Lint/build pass.

Docs:
- @README.md updated with new routes and component usage.
```

(Installation and usage details come straight from shadcn/Radix docs.) ([Shadcn][7], [Radix UI][6])

## H) “Actionable bug report → fix” (error‑first)

(Your avatar module example)

**Template**

```
Bug: Build error

{ERROR_BLOCK}

Goal: Identify root cause and fix without breaking About page.

Steps:
1) Parse error → missing peer dep @radix-ui/react-avatar.
2) Confirm component import path aligns with shadcn scaffolding.
3) Install and re‑generate avatar component if needed.

Commands:
- npm i @radix-ui/react-avatar
- npx shadcn@latest add avatar  # if component scaffold missing/misaligned

Docs for reference while implementing:
- shadcn Avatar docs (usage/imports).
- Radix Avatar docs (package/peer deps).

Verification:
- Rebuild; ensure no Module not found.
- Playwright MCP: visit /about, screenshot shows avatar in Card.
- Lint/build pass.

Post‑fix:
- Update @README.md (dependencies and components list).
```

(shadcn avatar usage and Radix install commands are explicitly documented.) ([Shadcn][7], [Radix UI][6], [npm][8])

---

# 3) “Prompt kit” — copy‑paste templates with variables

Below are compact, ready‑to‑paste snippets. Replace `{…}` placeholders.

### Kit A — Kickoff (resume + guardrails)

```
Load @{README} and @{PLAN}. Resume at "{PLAN_SECTION_ID}" now.
{PASTE: windsuff-session-rules}
```

### Kit B — Implement Feature

```
Implement {FEATURE_NAME} per @{SPEC_FILE} ("{SPEC_HEADING}").
Preserve: {PRESERVE_FEATURES}. Use {LIBS_OR_COMPONENTS} correctly.

Verify via MCP Playwright (screenshots + console), then:
npm run lint && npm run build && npm run content

Update @README.md when verified.
```

### Kit C — Visual/Nudge Fix

```
Fix: {SYMPTOM} on {PAGE_OR_COMPONENT}. Expected: {EXPECTED}.
Minimal diff; keep {PRESERVE_FEATURES}.

MCP: screenshot {STATES/VIEWPORTS}; ensure no console errors.
Run lint/build and resolve all issues.
```

### Kit D — shadcn/MDX Mapping

```
Map Markdown → shadcn components per @{SPEC_FILE}. Include typography, tables, links, blockquotes, code blocks.

Showcase in @hello-world.md with all elements.
Verify with MCP (screenshots). Lint/build/content must pass.
Record mapping in @README.md.
Docs: shadcn components + Radix primitives.
```

### Kit E — Pages: About & Tools

```
Create pages {PAGE_LIST}. 
- About: shadcn Card + Avatar contact card (responsive).
- Tools: responsive Card grid; each card is a link with image + name.

After coding: MCP screenshots (mobile/tablet/desktop). Lint/build pass.
```

### Kit F — Error‑First Bugfix (Avatar example)

```
Resolve build error:
{ERROR_BLOCK}

Likely missing @radix-ui/react-avatar or incorrect scaffold.
Run: npm i @radix-ui/react-avatar && npx shadcn@latest add avatar
Rebuild; MCP screenshot /about; Lint/build pass.
Update @README.md.
Docs: shadcn Avatar; Radix Avatar.
```

### Kit G — Progress Bar Feature

```
Implement "Reading progress bar" on article pages using shadcn Progress + IntersectionObserver/scroll handler.
Keep aligned to article width; do not overlap sidebar; sticky to bottom of header from initial pageload.

Verify states: top/mid/bottom; sidebar collapsed/expanded (MCP screenshots + console).
Run lint/build/content; update @README.md.
```

---

# 4) Extra tips that consistently improve agent output in Windsurf

* **Centralize “plan & state” files** (e.g., `@overall-plan.md`, `@work-log.md`) and always reference them explicitly—Windsurf recommends giving clear, concrete context for best results. ([docs.windsurf.com][1])
* **Use a project rules file** like `.windsurfrules` to encode “don’t touch X”, build/test systems, and API constraints—this gives the model persistent guardrails across tasks. ([DEV Community][9])
* **Lean on MCP Playwright for verification**—name the tools you expect it to call (e.g., `browser_take_screenshot`, `browser_console_messages`, `navigate`, `click`) so it performs end‑to‑end checks. ([GitHub][3], [til.simonwillison.net][4])
* **When pulling UI components** (shadcn), include the canonical install reference in the prompt—this avoids the common “module not found” trap for Radix primitives. ([Shadcn][7], [Radix UI][6], [npm][8])

---

[1]: https://docs.windsurf.com/best-practices/prompt-engineering?utm_source=chatgpt.com "Prompt Engineering"
[2]: https://windsurf.com/?utm_source=chatgpt.com "Windsurf - The most powerful AI Code Editor"
[3]: https://github.com/microsoft/playwright-mcp?utm_source=chatgpt.com "microsoft/playwright-mcp: Playwright MCP server"
[4]: https://til.simonwillison.net/claude-code/playwright-mcp-claude-code?utm_source=chatgpt.com "Using Playwright MCP with Claude Code"
[5]: https://ui.shadcn.com/docs/installation?utm_source=chatgpt.com "Installation - Shadcn UI"
[6]: https://www.radix-ui.com/primitives/docs/components/avatar?utm_source=chatgpt.com "Avatar – Radix Primitives"
[7]: https://ui.shadcn.com/docs/components/avatar?utm_source=chatgpt.com "Avatar - shadcn/ui"
[8]: https://www.npmjs.com/package/%40radix-ui/react-avatar?activeTab=dependents&utm_source=chatgpt.com "radix-ui/react-avatar"
[9]: https://dev.to/yardenporat/codium-windsurf-ide-rules-file-1hn9?utm_source=chatgpt.com "Codeium Windsurf IDE rules file"
