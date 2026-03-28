import "server-only"

import type { ContentInventoryRecord, ResearchPack } from "@/lib/content-ops/types"

type ResearchProvider = "fallback" | "brave" | "openrouter" | "minimax"

type ProviderConfig = {
  provider: ResearchProvider
  label: string
  configured: boolean
}

export function getResearchProviderOptions(): ProviderConfig[] {
  return [
    {
      provider: "brave",
      label: "Brave Search",
      configured: Boolean(process.env.BRAVE_API_KEY),
    },
    {
      provider: "openrouter",
      label: "OpenRouter",
      configured: Boolean(process.env.OPENROUTER_API_KEY),
    },
    {
      provider: "minimax",
      label: "MiniMax",
      configured: Boolean(process.env.MINIMAX_API_KEY && process.env.MINIMAX_API_URL),
    },
    {
      provider: "fallback",
      label: "Local strategy synthesizer",
      configured: true,
    },
  ]
}

function deriveQueries(asset: ContentInventoryRecord) {
  return [
    asset.title,
    `${asset.pillar} ${asset.cluster}`,
    `${asset.coreJtbd} ${asset.audienceSegment}`,
  ]
}

async function runBraveSearch(query: string) {
  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": process.env.BRAVE_API_KEY ?? "",
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Brave request failed with ${response.status}`)
  }

  const data = await response.json()
  const results = Array.isArray(data.web?.results) ? data.web.results : []

  return results.slice(0, 3).map((result: { title: string; url: string; description?: string }) => ({
    title: result.title,
    url: result.url,
    summary: result.description || "No summary returned.",
  }))
}

async function runOpenRouterResearch(asset: ContentInventoryRecord): Promise<ResearchPack["sourceSummaries"]> {
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
            "You create concise research-source suggestions for content strategy. Return JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            title: asset.title,
            pillar: asset.pillar,
            cluster: asset.cluster,
            jtbd: asset.coreJtbd,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "research_pack_sources",
          schema: {
            type: "object",
            properties: {
              sources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    url: { type: "string" },
                    summary: { type: "string" },
                  },
                  required: ["title", "url", "summary"],
                },
              },
            },
            required: ["sources"],
          },
        },
      },
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with ${response.status}`)
  }

  const payload = await response.json()
  const content = payload.choices?.[0]?.message?.content
  if (typeof content !== "string") return []

  try {
    const parsed = JSON.parse(content)
    return parsed.sources ?? []
  } catch {
    return []
  }
}

async function runMiniMaxResearch(asset: ContentInventoryRecord): Promise<ResearchPack["sourceSummaries"]> {
  const response = await fetch(process.env.MINIMAX_API_URL ?? "", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      title: asset.title,
      pillar: asset.pillar,
      cluster: asset.cluster,
      jtbd: asset.coreJtbd,
      mode: "research_pack",
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`MiniMax request failed with ${response.status}`)
  }

  const payload = await response.json()
  return Array.isArray(payload.sources) ? payload.sources.slice(0, 3) : []
}

export async function generateResearchPack(
  asset: ContentInventoryRecord,
  provider: ResearchProvider
): Promise<ResearchPack> {
  const providerOptions = getResearchProviderOptions()
  const providerDetails = providerOptions.find((option) => option.provider === provider)
  const queries = deriveQueries(asset)

  let sourceSummaries: ResearchPack["sourceSummaries"] = []
  let status: ResearchPack["status"] = "ready"
  let selectedProvider = provider

  try {
    if (provider === "brave" && process.env.BRAVE_API_KEY) {
      sourceSummaries = await runBraveSearch(queries[0])
    } else if (provider === "openrouter" && process.env.OPENROUTER_API_KEY) {
      sourceSummaries = await runOpenRouterResearch(asset)
    } else if (provider === "minimax" && process.env.MINIMAX_API_KEY && process.env.MINIMAX_API_URL) {
      sourceSummaries = await runMiniMaxResearch(asset)
    } else {
      selectedProvider = "fallback"
      status = provider === "fallback" || providerDetails?.configured ? "ready" : "missing_provider"
    }
  } catch {
    selectedProvider = "fallback"
    status = "missing_provider"
  }

  if (sourceSummaries.length === 0) {
    sourceSummaries = [
      {
        title: `${asset.title} source audit`,
        url: asset.url,
        summary: asset.evidence,
      },
      {
        title: `${asset.pillar} cluster brief`,
        url: asset.parentHubs[0] || "/dashboard",
        summary: asset.differentiationAngle,
      },
    ]
  }

  return {
    id: `${asset.id}-${selectedProvider}`,
    assetId: asset.id,
    provider: selectedProvider,
    generatedAt: new Date().toISOString(),
    status,
    queryCluster: queries,
    competingAngles: [
      `What does most existing ${asset.cluster.toLowerCase()} content miss?`,
      `Where can this page show firsthand proof instead of generic advice?`,
      `What would make this asset meaningfully better than a thin pSEO page?`,
    ],
    sourceSummaries,
    recommendedStructure: [
      "Sharp thesis and why this asset exists",
      "What problem it solves for the target audience",
      "Evidence or proof section grounded in existing site content",
      "Actionable framework, checklist, or examples",
      "Recommended next internal steps",
    ],
    risks: [
      "Thin derivative content if proof is not carried through from the source asset.",
      "Overlapping with an existing flagship unless the page has a sharper JTBD.",
      "Publishing before indexation, structured data, and internal links are reviewed.",
    ],
    relatedInternalContent: asset.relatedIds,
    recommendedInternalLinks: asset.nextSteps,
    seoSuggestions: [
      `Keep ${asset.pageClass.toLowerCase()} positioning explicit in the introduction.`,
      `Use ${asset.pillar.toLowerCase()} language consistently so the page reinforces the hub.`,
      "Add a clear next-step module that routes to proof assets or dashboards.",
    ],
  }
}
