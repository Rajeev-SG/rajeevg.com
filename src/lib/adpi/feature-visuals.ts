export type Example = {
  kind: "library" | "campaign" | "documentation"
  title: string
  description: string
  image: string
  alt: string
  source: { label: string; url: string }
  checkedAt: string
  note?: string
}

export type Diagram = {
  kind: "flow" | "comparison" | "scope"
  title: string
  description: string
  columns: [string, string, string]
  rows: {
    features: string[]
    cells: [string, string, string]
    outputImage?: string
  }[]
  sources: { label: string; url: string }[]
  note?: string
}

export type FeatureVisual = Example | Diagram
