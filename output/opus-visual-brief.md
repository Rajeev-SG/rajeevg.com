# Opus visual brief: the thin controller / heavy worker split

## Objective

Create one polished, editorial-quality SVG for a technical article. The reader should understand, at a glance, how a Codex task controller keeps expensive Sol work in the control plane while moving substantive execution to a persistent GLM worker.

## Output

- Write exactly one file: `public/images/blog/glm-task-controller/controller-worker-architecture.svg`
- Canvas: 1600 x 1050, responsive SVG with a viewBox.
- Light-background editorial style that remains legible in dark-mode page chrome.
- Accessible `<title>` and `<desc>`.
- No external fonts, raster images, scripts, animation, or embedded HTML.

## Required content

Build a left-to-right composition with three visually distinct layers:

1. **Intent and control plane**
   - User request
   - Sol task controller
   - A compact loop showing the native Codex operations: create/fork, read, message, wait, inspect result
   - Policy guardrails around the controller: "manage, route, verify" and "do not implement substantive work"

2. **Persistent execution plane**
   - One GLM worker task labelled `z-ai/glm-5.3-flash`
   - Worker responsibilities: research, edit, test, browser proof, deploy
   - Show that follow-up messages return to the same worker rather than spawning replacements

3. **Model routing and evidence**
   - Codex child config -> `model_provider = cliproxyapi`
   - Local endpoint `127.0.0.1:8080/v1`
   - CLIProxyAPI normalization/router
   - OpenRouter Responses API
   - GLM model
   - Telemetry sidecar observing controller and worker separately

Include a small evidence callout, clearly labelled as one measured TradeHero PRD run:

- Sol controller uncached prompt: 491,806
- GLM worker uncached prompt: 5,832,037
- GLM share of paired uncached prompt volume: 92%

Add a subtle caveat near the callout: cached context and completion tokens are reported separately; this is workload evidence, not a provider bill.

## Visual direction

Avoid a generic row of coloured boxes. Use a control-room metaphor: a compact controller console at upper left steering a larger execution workspace, with the model-routing path running beneath it like infrastructure. Make the persistent feedback loop obvious. Use restrained navy, cobalt, teal, warm amber, and off-white. Strong typographic hierarchy, generous spacing, crisp connectors, no connector crossing through labels.

The diagram must earn its place by showing relationships the prose cannot convey as quickly: task lifecycle, persistence, policy boundary, provider route, and separate measurement.

## Boundaries

- Read-only except for the single SVG output path.
- Do not edit article prose, package files, tests, or existing assets.
- Do not run Git, network calls, package installs, or deployment commands.
- Do not create additional files.

## Acceptance

- SVG parses as XML.
- All text fits at 1600 x 1050 and remains readable when displayed around 800 px wide.
- No overlaps, clipped text, orphaned arrows, or lines through labels.
- The controller is visually smaller than the execution plane.
- The same-worker feedback loop and the CLIProxyAPI -> OpenRouter -> GLM route are unmistakable.
