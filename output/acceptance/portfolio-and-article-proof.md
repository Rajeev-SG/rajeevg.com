# Acceptance: portfolio page and portfolio article

## Expected behavior

- `/projects` should list every checked-in portfolio project that has a verified public GitHub repo and public live URL.
- Each project card should expose both a GitHub link and a live-site link.
- `/blog/the-projects-behind-this-portfolio` should render as a long-form article, include the new project spotlights, and link back to `/projects`.
- The article and portfolio route should both remain usable on desktop and mobile.

## Executed steps

1. Built the site with `pnpm build`.
2. Started the production server with `pnpm exec next start -p 3055`.
3. Verified `http://127.0.0.1:3055/projects` responds with `200`.
4. Used `playwright-cli` against the production build to capture desktop and mobile screenshots for `/projects`.
5. Used `playwright-cli` against the production build to capture desktop and mobile screenshots for `/blog/the-projects-behind-this-portfolio`.
6. Proved the article-to-portfolio journey by clicking the in-article `Portfolio projects on rajeevg.com` link and asserting the `/projects` hero loaded.
7. Deployed to production with `vercel deploy --prod --yes`.
8. Verified `https://rajeevg.com/projects` and `https://rajeevg.com/blog/the-projects-behind-this-portfolio` both return `200`.
9. Re-ran the article-to-portfolio journey on the live domain and captured a production screenshot.

## Evidence

- screenshot: `/Users/rajeev/Code/rajeevg.com/output/playwright/20260322-235827/projects-desktop.png`
- screenshot: `/Users/rajeev/Code/rajeevg.com/output/playwright/20260322-235827/projects-mobile.png`
- screenshot: `/Users/rajeev/Code/rajeevg.com/output/playwright/20260322-235827/article-desktop.png`
- screenshot: `/Users/rajeev/Code/rajeevg.com/output/playwright/20260322-235827/article-mobile.png`
- screenshot: `/Users/rajeev/Code/rajeevg.com/output/playwright/20260322-235827/article-live-desktop.png`
- browser assertion: six project card IDs found on `/projects` (`workflow-garden`, `proof-pack`, `choice-compass`, `model-intelligence-maintainer`, `rajeevg-com`, `blog`)
- browser assertion: article `h1` text resolved to `The Projects Behind This Portfolio`
- browser assertion: `Quick scan` heading rendered on the article
- browser assertion: article link-through to `/projects` succeeded and the portfolio hero was visible
- production assertion: live article link-through reached `https://rajeevg.com/projects`
- HTTP check: `https://rajeevg.com/projects` returned `200`
- HTTP check: `https://rajeevg.com/blog/the-projects-behind-this-portfolio` returned `200`
- logs: local production-browser console showed repeated `404` requests for `/_vercel/insights/script.js`, which is expected when Vercel Analytics is present outside the Vercel runtime
- fresh run id / timestamped artifact directory: `20260322-235827`
- final reachable action or content proven: article link-through to the portfolio page, plus visible GitHub/live buttons on mobile and desktop

## Result

- PASS
- viewport and section coverage checked: desktop and mobile for both `/projects` and the article page
- final action or content completed: yes, the article linked through to `/projects` and the destination hero rendered correctly
- screenshot review: passed; desktop preserves a readable editorial layout and mobile keeps the project cards and long-form article in a coherent single-column sequence

## Remaining risk

- The portfolio list is intentionally checked-in metadata, not a runtime GitHub sync. Adding future public projects will still require updating `src/lib/portfolio-projects.ts`.
- Local production proof cannot fully validate the Vercel Analytics script because the `/_vercel/insights/script.js` endpoint only exists on the deployed host.
