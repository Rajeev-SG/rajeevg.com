# Acceptance: plain-language Codex and OpenCode article

## Expected behavior

A non-technical reader should be able to understand the subscription-limit problem, the Codex/OpenCode split, the current verdict, the meaningful metrics, and the next steps before reaching the technical appendix.

## Executed steps

- Built and served the production Next.js application locally.
- Opened the article in desktop-light and mobile-dark Playwright projects.
- Dismissed the analytics consent prompt when present.
- Confirmed the new plain-language title and short verdict.
- Confirmed the zero-Codex-token execution result, the 3.13x tradeoff, and the 620-call leak were visible.
- Reached `The manager and the workshop` and `What needs to happen next`.
- Checked horizontal overflow and captured browser console errors.

## Evidence

- `local/plain-language-article-desktop-light.png`
- `local/plain-language-article-mobile-dark.png`
- Playwright: `2 passed (1.3s)`

## Result

- PASS
- The practical explanation, verdict, metrics, and next steps were reachable on desktop and mobile.
- Horizontal overflow was at most 1px.
- No browser console errors were captured.

## Remaining risk

The comprehension checks prove that the intended content is present and readable, not that a representative group of non-technical readers has completed a formal comprehension study.
