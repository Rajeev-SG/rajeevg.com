import "server-only"

import type { ContentInventoryRecord, EditorFrontmatter, ResearchPack } from "@/lib/content-ops/types"

export type ContentAssistAction =
  | "generate-draft"
  | "improve-intro"
  | "improve-conclusion"
  | "add-faq"
  | "add-comparison-table"
  | "tighten-copy"

type AssistResult = {
  action: ContentAssistAction
  markdown: string
  provider: "openrouter" | "fallback"
  title: string
}

function normalizeFaqMarkdown(markdown: string) {
  const trimmed = markdown.trim()

  if (/^##\s+Frequently asked questions\b/im.test(trimmed)) {
    return trimmed.replace(/^##\s+Frequently asked questions\b/im, "## Frequently asked questions")
  }

  if (/^##\s+FAQ\b/im.test(trimmed)) {
    return trimmed.replace(/^##\s+FAQ\b/im, "## Frequently asked questions")
  }

  return `## Frequently asked questions\n\n${trimmed}`
}

function normalizeAssistMarkdown(action: ContentAssistAction, markdown: string) {
  if (action === "add-faq") {
    return normalizeFaqMarkdown(markdown)
  }

  return markdown.trim()
}

function buildFallbackResult(
  action: ContentAssistAction,
  asset: ContentInventoryRecord,
  frontmatter: EditorFrontmatter,
  researchPack: ResearchPack | null,
  body: string
): AssistResult {
  const targetKeywords = [asset.cluster, asset.pillar, ...frontmatter.tags].filter(Boolean)
  const firstLinks = researchPack?.recommendedInternalLinks.slice(0, 3) || asset.nextSteps.slice(0, 3)
  const faqItems = (researchPack?.competingAngles || []).slice(0, 3)

  switch (action) {
    case "generate-draft":
      return {
        action,
        provider: "fallback",
        title: "First draft",
        markdown: `# ${frontmatter.title}

${frontmatter.description || asset.notes}

## Why this matters

${asset.coreJtbd}

## What most teams get wrong

- They treat ${asset.cluster.toLowerCase()} as a generic best-practice topic instead of an operational decision.
- They skip proof, implementation detail, or verification.
- They do not connect the article to the next step in the wider system.

## A practical way to approach it

${(researchPack?.recommendedStructure || []).map((item) => `### ${item}\n\nWrite the section with first-hand proof, explicit trade-offs, and clear operator guidance.`).join("\n\n")}

## Internal links to include

${firstLinks.map((link) => `- ${link}`).join("\n")}

## SEO notes

- Target query cluster: ${targetKeywords.join(", ")}
- Keep the introduction explicit about the reader problem and the system outcome.
- Use proof, examples, and workflow detail so the page is not a thin template.
`,
      }
    case "improve-intro":
      return {
        action,
        provider: "fallback",
        title: "Improved intro",
        markdown: `${frontmatter.description || asset.notes}

This page sits in the ${asset.pillar.toLowerCase()} cluster and should quickly show the reader three things: what problem they are actually dealing with, why the obvious approach breaks down, and what concrete system or workflow change will help. Ground the opening in a real constraint, not a generic promise.`,
      }
    case "improve-conclusion":
      return {
        action,
        provider: "fallback",
        title: "Conclusion",
        markdown: `## Conclusion

The useful version of ${asset.cluster.toLowerCase()} is not a slogan or a tooling stack. It is a repeatable operating approach that survives real constraints, keeps the important risks visible, and gives the reader a clear next move.

If this page is doing its job, the reader should now know when to use this approach, when to avoid it, and where to go next in the rajeevg.com system for proof, tooling, or a deeper workflow.`,
      }
    case "add-faq":
      return {
        action,
        provider: "fallback",
        title: "FAQ section",
        markdown: `## Frequently asked questions

${faqItems
  .map(
    (item) => `### ${item.replace(/\?$/, "")}?\n\nAnswer this with a direct, concrete explanation tied back to the workflow, evidence, or proof assets already linked in the article.`
  )
  .join("\n\n")}`,
      }
    case "add-comparison-table":
      return {
        action,
        provider: "fallback",
        title: "Comparison table",
        markdown: `## Comparison

| Option | Best when | Main risk | What to verify |
| --- | --- | --- | --- |
| Manual workflow | You need judgement and low volume | Slow throughput | Whether the process is repeatable |
| Promptless automation | The workflow can be standardized | Silent drift | Inputs, QA checks, and rollback |
| Programmatic content system | Structured data creates real page differences | Thin or duplicative pages | Delta, indexing controls, and internal links |`,
      }
    case "tighten-copy":
      return {
        action,
        provider: "fallback",
        title: "Tighter draft",
        markdown: `${body}

<!-- Editor note: tighten repeated claims, keep headings specific, and remove any section that does not carry proof, a decision rule, or a clear next step. -->`,
      }
  }
}

async function runOpenRouterAssist(
  action: ContentAssistAction,
  asset: ContentInventoryRecord,
  frontmatter: EditorFrontmatter,
  researchPack: ResearchPack | null,
  body: string
) {
  const response = await fetch(process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an editorial assistant for rajeevg.com. Return markdown only. Be specific, practical, and avoid generic SEO filler.",
        },
        {
          role: "user",
          content: JSON.stringify({
            action,
            asset: {
              title: asset.title,
              pageClass: asset.pageClass,
              pillar: asset.pillar,
              cluster: asset.cluster,
              audience: asset.audienceSegment,
              jtbd: asset.coreJtbd,
              notes: asset.notes,
              nextSteps: asset.nextSteps,
            },
            frontmatter,
            researchPack,
            currentBody: body,
          }),
        },
      ],
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`OpenRouter assist failed with ${response.status}`)
  }

  const payload = await response.json()
  const markdown = payload.choices?.[0]?.message?.content

  if (typeof markdown !== "string" || !markdown.trim()) {
    throw new Error("OpenRouter assist returned an empty response")
  }

  return markdown.trim()
}

export async function generateContentAssist(params: {
  action: ContentAssistAction
  asset: ContentInventoryRecord
  frontmatter: EditorFrontmatter
  researchPack: ResearchPack | null
  body: string
}): Promise<AssistResult> {
  const { action, asset, frontmatter, researchPack, body } = params

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const markdown = await runOpenRouterAssist(action, asset, frontmatter, researchPack, body)
      return {
        action,
        markdown: normalizeAssistMarkdown(action, markdown),
        provider: "openrouter",
        title: action.replace(/-/g, " "),
      }
    } catch {
      const result = buildFallbackResult(action, asset, frontmatter, researchPack, body)
      return {
        ...result,
        markdown: normalizeAssistMarkdown(action, result.markdown),
      }
    }
  }

  const result = buildFallbackResult(action, asset, frontmatter, researchPack, body)
  return {
    ...result,
    markdown: normalizeAssistMarkdown(action, result.markdown),
  }
}
