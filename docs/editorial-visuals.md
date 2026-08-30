# Editorial visuals on rajeevg.com

Durable standard: `~/.codex/docs/editorial-visual-standard.md`. This file is the repo-local
quick reference for where visual assets live and how they are generated.

## Layout

- `public/images/editorial/` — flagship article figures (SVG rendered from the sources below)
- `public/images/solutions/` — solution-card thumbnails (SVG, editorial, crop-safe)
- `public/images/articles-2026-08/` — legacy batch-generated figures retained for older assets;
  new flagship figures go to `editorial/`
- `public/downloads/*.excalidraw` / `*.drawio` — editable sources, one per published figure

## Generators

- `scripts/generate-editorial-excalidraw.mjs` — bespoke conceptual figures
  (timeline, waterfall, decision tree, loop, grouped grid) plus their SVG renders
- `/tmp`-based draw.io builds are landed as committed `.drawio` files; regenerate by
  editing the committed XML, or by exporting from draw.io desktop

## Rules of thumb

1. One sentence of teaching objective before drawing anything.
2. No figure count quota; prose references must be updated when figures are removed.
3. Dense architecture → native draw.io (`drawio-no-overlap` rules: no line-through-text,
   orthogonal routing, legend instead of edge labels). Conceptual/journey/decision →
   bespoke Excalidraw. Real interfaces → screenshot.
4. Card thumbnails use `object-contain` (diagrams) — `object-cover` only for screenshots.
5. Every published figure: editable source + alt text + caption with evidence date.
