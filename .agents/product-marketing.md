# gog-marketing product marketing context

**Document version:** v2
**Last updated:** 2026-10-13
**Canonical source:** This file in Rajeev-SG/rajeevg.com. The gog-marketing repository's `.agents/product-marketing.md` points here; do not maintain a second factual copy.

## Product overview and positioning

**One-liner:** Your Google marketing tools. One place to get things done.
**Category:** Google tool access and controlled agent execution for marketers.
**Product:** Standard gog extended with marketing APIs, plus account connections, service/resource/tool permissions and a hosted control plane. The web interface manages access; it is not a marketing performance dashboard.
**Primary benefit:** Put Google marketing tools to work through approved agent tasks.
**Supporting benefit:** An administrator handles one-time Google Cloud/OAuth setup. End users should not have to manage API credentials themselves. Do not claim nobody needs Google Cloud setup.
**Business model/pricing:** No public pricing or self-service launch established by the sources reviewed. Do not invent a free trial, guarantee, plan or signup offer.

## Audience, personas and jobs

Knowledgeable marketers who are not developers; marketing-operations leads who select account access; technical administrators who perform initial setup. Company size, purchasing roles and validated segments are not established.

Jobs: select the Google accounts/resources an agent may use; retrieve supported reports/account information; authorize specific supported changes while limiting scope. The marketer wants to get work done, the administrator owns setup, and the access owner needs clear permissions.

## Problems, alternatives and differentiation

Owner-provided positioning hypotheses: setup overhead, switching between tools, waiting for technical help and uncertainty about agent access. These are not validated customer findings. Alternatives include individual Google interfaces, scripts and engineering support; no comparative performance claims are established.

Differentiation evidenced in source: standard Workspace and marketing command surfaces share an engine; account-specific tool/resource grants and separate write/destructive permissions bound agent execution. Connecting an account does not grant blanket access.

## Claims and evidence boundary

Source checkpoint: [gog-marketing main at 687973fc](https://github.com/Rajeev-SG/gog-marketing/tree/687973fc).

| Topic | Evidence | Safe wording / restriction |
| --- | --- | --- |
| Full product | [README](https://github.com/Rajeev-SG/gog-marketing/blob/687973fc/README.md) | Standard gog plus marketing extensions. Do not reduce the full product to four services. |
| Google setup | README, Getting started | Administrator completes technical setup; users select approved services/assets. |
| Hosted launch | [Audit-free readiness](https://github.com/Rajeev-SG/gog-marketing/blob/687973fc/docs/hosted/audit-free-readiness.md) | Private testing cohort, not public-beta readiness. Google verification not approved. |
| Tool implementation | Same readiness checkpoint; native catalogue and runner | GA4 reads and selected writes, GTM commands, Search Console tools and bounded BigQuery reads exist in code. Expanded hosted services remain untested live. Never turn fixture/implementation evidence into a claim of proven deployed execution. |
| Google Ads | Hosted consent boundary in readiness | Part of the wider CLI product; excluded from hosted v1. Do not advertise a hosted Google Ads connection. |
| Security | Per-account tool/resource grants and explicit write/destructive permissions | Describe the controls. Do not promise absolute security, certifications or compliance approval. |
| Natural language | Owner's target experience, not evidence of delivered functionality | Clearly label as planned/target; do not imply a working hosted chat task interface. |
| Product images | Landing illustration and README approved UI references | Label illustrative views. No customer performance dashboard or customer proof implied. |

Repositories move independently. Recheck current source and live acceptance before changing any status above. Code support is not live proof; Google consent is not tool or write authorization.

## Objections and switching dynamics

- Setup: a technical administrator still owns initial configuration.
- Permissions: only enabled accounts, resources and tools may be used; writes need separate authorization.
- Supported services: spotlight GA4, GTM, Search Console and BigQuery, with service-specific limits and pilot status visible.
- Pricing/access: public signup/pricing not announced; direct the reader to the setup guide.
- Fit: not a proven public SaaS reporting dashboard or a generally available natural-language assistant.

Push/pull/habit/anxiety are hypotheses: reduce repeated configuration and bring approved tasks to agents; individual Google UIs remain familiar; users may worry about permissions and readiness. Do not present these as interview findings.

## Customer language and research quality

Use the owner's supplied direction: "get things done", "choose your tools", "make changes", "without jumping between tools" when the capability supports it. These are owner-provided wording, not customer quotations.

No customer interviews, support tickets, testimonials or representative independent sample were supplied. Confidence in voice-of-customer hypotheses is low/unvalidated. Do not fabricate quotes, frequency scores, personas, customers, time savings or conversion improvements. Customer research in this pass analyzes the supplied brief and repository evidence only.

## Brand voice and glossary

Direct, specific, knowledgeable and conversational. Address the marketer as "you". Lead with the task, then the benefit and its supporting feature. Keep personality without hype.

Avoid generic SaaS claims ("marketers love it", "faster results", "more momentum"), formulaic oppositions, negation lists, technical jargon and unsupported reassurance.

Account: connected Google identity. Resource/asset: a property, container, site, dataset or other service-specific item. Tool: an operation an agent may invoke. Write permission: separately approved authority to change something. Pilot: limited testing, not general availability.

## Proof points and conversion goal

Proof: public source and documented access controls. No customer logos, testimonials, outcome metrics or conversion baseline are available.

One conversion goal today: **Read the setup guide** at https://github.com/Rajeev-SG/gog-marketing#getting-started. Repeat in hero and final section. Never label a GitHub destination "Connect your Google account". Only switch to that action after a public product route and its account-connection flow are verified.

## Editorial workflow

Product Marketing → Customer Research → Copywriting → Copy Editing → Humanizer → CRO.

**Hard evidence override:** This context's claim boundaries override generic skill examples, reference advice and evaluation assertions. Zero Risk and Prove It passes may use guarantees, trials, pricing, metrics, customer proof or timeframes only when the evidence table establishes them. Otherwise identify missing evidence privately; never generate or publish those claims. Imported eval examples are not product facts or permission to invent them.

All gog-marketing landing-copy and metadata changes must use this context and the editorial workflow.

Use website-local Corey Haines skills under `.agents/skills`; Humanizer already exists at `~/.codex/skills/humanizer`. Edit through clarity, voice, benefit, proof, specificity, emotional relevance and friction passes. Finish with an AI-tell check and inspect the actual CTA destination. Copy-only work must preserve the visual design and must not invent evidence or expand product scope.

## Changelog

- v2 (2026-10-13) — Made evidence gates explicit overrides of generic skill examples/evals and required the context for landing-copy changes.
- v1 (2026-10-13) — Established task-first positioning and private-pilot claim boundaries from source; distinguished owner language from customer research and selected an honest setup-guide CTA.
