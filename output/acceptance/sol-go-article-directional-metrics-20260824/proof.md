# Acceptance: Sol + Go article directional metrics

## Expected behavior

The published architecture article exposes the new directional metrics on desktop and mobile without clipping, horizontal page overflow, or browser console errors.

## Executed steps

- Built the production Next.js site and served it at `http://127.0.0.1:3011`.
- Opened `/blog/how-i-split-sol-planning-from-opencode-go-execution` with Playwright.
- Exercised the consent control when present.
- Reached the heading `A first directional reading from the build itself`.
- Asserted the `5,166,631`, `3.13`, and `620` findings were visible.
- Checked document overflow and captured browser console errors.
- Repeated the flow in desktop-light and mobile-dark projects.

## Evidence

- `local/directional-metrics-desktop-light.png`
- `local/directional-metrics-mobile-dark.png`
- Playwright result: `2 passed (1.6s)`

## Result

- PASS
- The new metrics section was reachable and readable in both viewport classes.
- Horizontal page overflow was `<= 1px` and the captured console-error list was empty.

## Remaining risk

This proves the local production build. A fresh production canary is still required after deployment.
