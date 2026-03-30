"use client"

import { MDXContent } from "@/components/mdx-content"
import { mdxComponents } from "@/components/mdx-components"
import MermaidInit from "@/components/mermaid-init"
import { MermaidTooltips } from "@/components/mermaid-tooltips"

export function PreviewRenderer({ code }: { code: string }) {
  return (
    <section
      id="article-content"
      className="relative rounded-xl border bg-background p-6 prose-sm sm:prose-base prose-headings:scroll-mt-24 prose-pre:rounded-lg dark:prose-invert"
    >
      <MDXContent code={code} components={mdxComponents} />
      <MermaidInit />
      <MermaidTooltips />
    </section>
  )
}
