import { cache } from "react"
import type { Metadata } from "next"
import Link from "next/link"

import { FeatureGuide } from "@/components/adpi/feature-guide"
import { explorerPath, featurePath, getFeatureGuide } from "@/lib/adpi/feature-pages"

export const revalidate = 86400

// Render each guide on its first request.
export function generateStaticParams() {
  return []
}

const loadFeature = cache(getFeatureGuide)

type Props = { params: Promise<{ featureId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { featureId } = await params
  const { name } = await loadFeature(featureId)
  return {
    title: name ?? "Feature guide",
    alternates: { canonical: featurePath(featureId) },
  }
}

export default async function FeatureGuidePage({ params }: Props) {
  const { featureId } = await params
  const { name, page } = await loadFeature(featureId)
  if (page) return <FeatureGuide guide={page} />

  return (
    <section className="mx-auto max-w-[55rem] space-y-4">
      <Link className="text-sm text-primary underline underline-offset-4" href={explorerPath}>
        Back to the explorer
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">{name ?? "Feature guide"}</h1>
      <p className="text-muted-foreground">Guide not yet available for this feature.</p>
    </section>
  )
}
