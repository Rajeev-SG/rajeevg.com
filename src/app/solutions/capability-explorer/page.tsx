import type { Metadata } from "next"

import { FeatureBrowse } from "@/components/adpi/feature-browse"
import { VisualGallery } from "@/components/adpi/visual-gallery"
import { explorerPath, featurePath, getFeatureListings } from "@/lib/adpi/feature-pages"

const description = "Find ad platform features, see how to set them up and compare what they do."

export const metadata: Metadata = {
  title: "Ad Platform Capability Explorer",
  description,
  alternates: { canonical: explorerPath },
}

export default async function CapabilityExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const [features, { q }] = await Promise.all([getFeatureListings(), searchParams])
  const query = typeof q === "string" ? q : ""

  return (
    <section className="space-y-6" data-analytics-section="capability_explorer" data-analytics-item-type="tool">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ad Platform Capability Explorer</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
      </header>
      <FeatureBrowse
        key={query}
        features={features.map((feature) => ({ ...feature, href: featurePath(feature.id) }))}
        initialQuery={query}
        gallery={<VisualGallery features={features} />}
      />
    </section>
  )
}
