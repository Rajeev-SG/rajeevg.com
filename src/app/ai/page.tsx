import type { Metadata } from "next"

import { WritingCollection } from "@/components/writing-collection"

export default function AiPage() {
  return (
    <WritingCollection
      eyebrow="AI"
      title="Practical AI in real workflows"
      description="Writing about using AI to build software, improve operational work, and produce clear business results without adding unnecessary complexity."
      matchingTags={["ai", "ai-workflows", "codex", "qwen", "local-models"]}
    />
  )
}

export const metadata: Metadata = {
  title: "AI writing",
  description: "Practical writing by Rajeev Gill about AI-assisted software and operational workflows.",
  alternates: { canonical: "/ai" },
}
