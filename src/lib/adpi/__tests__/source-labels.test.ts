import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Guide } from "../guide-types"

// A published guide whose citations carry the page's own name. The site
// must render "Site — Page title", never a generic "<Platform> documentation".
const guide: Guide = {
  feature_id: "meta.lookalike-audiences",
  name: "Lookalike audiences",
  vendor: "Meta",
  platform: "Paid Social",
  capability_ids: [],
  sections: [
    {
      kind: "definition",
      status: "documented",
      summary: "",
      claims: [
        {
          text: "A lookalike audience models a new audience on a source audience you own.",
          status: "documented",
          evidence: [
            {
              source_id: "meta.lookalike.about",
              source_url: "https://www.facebook.com/business/help/164749007013531",
              source_site: "Meta Business Help Centre",
              source_title: "About Lookalike Audiences",
            },
          ],
        },
      ],
    },
    {
      kind: "relationships",
      status: "documented",
      claims: [],
      summary: "Compared on other platforms.",
    },
    {
      kind: "sources",
      status: "documented",
      claims: [
        {
          text: "Meta Business Help Centre — About Lookalike Audiences: https://www.facebook.com/business/help/164749007013531",
          status: "documented",
          evidence: [
            {
              source_id: "meta.lookalike.about",
              source_url: "https://www.facebook.com/business/help/164749007013531",
              source_site: "Meta Business Help Centre",
              source_title: "About Lookalike Audiences",
            },
          ],
        },
      ],
    },
  ],
  relationships: [
    {
      feature_id: "tt.lookalike-audiences",
      name: "Lookalike Audiences",
      vendor: "TikTok",
      kind: "partial_alternative",
      difference: "TikTok only lists audiences created from a Custom Audience.",
      context: "Prospecting from an existing customer list.",
      status: "documented",
      evidence: [
        {
          source_id: "tt.custom_audiences",
          source_url: "https://ads.tiktok.com/help/article/custom-audiences?lang=en",
          source_site: "TikTok Ads Help Center",
          source_title: "About Custom Audiences",
        },
      ],
    },
  ],
}

vi.mock("../guides", () => ({
  getGuideIndexOutcome: async () => ({
    index: {
      schema_version: 1,
      release: "rel1",
      guides: [
        {
          feature_id: "meta.lookalike-audiences",
          name: "Lookalike audiences",
          vendor: "Meta",
          platform: "Paid Social",
          summary: "A lookalike audience models a new audience on a source audience.",
          category: "Audiences",
          control_mode: "signal",
          detail: "guides/rel1/meta.lookalike-audiences.json",
        },
      ],
    },
    source: "remote",
  }),
  guideEntry: (
    index: { guides: { feature_id: string }[] },
    featureId: string,
  ) => index.guides.find((entry) => entry.feature_id === featureId) ?? null,
  getGuideDetail: async () => ({ schema_version: 1, release: "rel1", guide }),
}))

const GENERIC_LABEL = /^(?:Pinterest|Google Ads|Meta|TikTok Ads) documentation$/

describe("source labels name the page", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("labels each source with its site and page title", async () => {
    const { getFeatureGuide } = await import("../feature-pages")
    const { page } = await getFeatureGuide("meta.lookalike-audiences")
    expect(page).toBeDefined()
    const labels = page!.sources.map((source) => source.label)
    expect(labels).toContain("Meta Business Help Centre — About Lookalike Audiences")
    // The equivalents-table citation is named too, not just the sources list.
    expect(labels).toContain("TikTok Ads Help Center — About Custom Audiences")
  })

  it("never falls back to a generic platform label", async () => {
    const { getFeatureGuide } = await import("../feature-pages")
    const { page } = await getFeatureGuide("meta.lookalike-audiences")
    for (const source of page!.sources) {
      expect(source.label).not.toMatch(GENERIC_LABEL)
      expect(source.label.length).toBeGreaterThan(0)
    }
  })
})
