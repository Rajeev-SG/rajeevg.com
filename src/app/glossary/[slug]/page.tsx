import { permanentRedirect } from "next/navigation"

const articleByLegacySlug: Record<string, string> = {
  "agentic-engineering": "/blog/from-ai-pilots-to-business-value",
  "measurement-system-of-record": "/blog/why-browser-consent-and-source-blending-make-marketing-measurement-harder",
  "first-party-analytics-delivery": "/blog/how-we-built-a-consented-first-party-analytics-stack",
}

export default async function GlossaryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  permanentRedirect(articleByLegacySlug[slug] ?? "/blog")
}
